// Creates (or rotates the password of) the login role the chat assistant's
// generated SQL runs as, then writes SEARCH_DATABASE_URL to .env.local.
//
// The role owns nothing and is granted nothing, so the only data it can read
// is the temporary table that lib/agents/tools/search-documents.ts fills with
// one organization's documents for each query. Because it logs in as itself,
// a generated query cannot switch to a more privileged role.
//
// Run once per Neon branch: pnpm db:search-role
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { config } from 'dotenv';
import pg from 'pg';

config({ path: ['.env.local', '.env'], quiet: true });

const ROLE = 'docufinance_search';
const ENV_FILE = '.env.local';

async function main() {
  const adminUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL;
  const pooledUrl = process.env.DATABASE_URL;
  if (!adminUrl || !pooledUrl) {
    throw new Error(
      'Set DATABASE_URL and DATABASE_URL_UNPOOLED (run `neon deploy` or `neon env pull`).'
    );
  }

  const password = randomBytes(24).toString('base64url');
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();

  try {
    const exists = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [ROLE]);
    const verb = exists.rowCount ? 'ALTER' : 'CREATE';
    // Identifiers and passwords can't be bound as parameters in DDL; ROLE is a
    // constant and the password is base64url, so neither needs escaping.
    await client.query(
      `${verb} ROLE ${ROLE} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD '${password}'`
    );

    const { rows } = await client.query(
      `SELECT
         has_table_privilege($1, 'public.documents', 'SELECT') AS documents,
         has_table_privilege($1, 'public."user"', 'SELECT') AS users,
         (SELECT count(*) FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.member WHERE r.rolname = $1)::int AS memberships`,
      [ROLE]
    );
    const check = rows[0];
    if (check.documents || check.users || check.memberships > 0) {
      throw new Error(`${ROLE} has privileges it should not have: ${JSON.stringify(check)}`);
    }
    console.log(
      `${verb === 'CREATE' ? 'Created' : 'Rotated password for'} ${ROLE} (no table access, no role memberships).`
    );
  } finally {
    await client.end();
  }

  const url = new URL(pooledUrl);
  url.username = ROLE;
  url.password = password;
  const line = `SEARCH_DATABASE_URL="${url.toString()}"`;

  const current = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  const next = /^SEARCH_DATABASE_URL=.*$/m.test(current)
    ? current.replace(/^SEARCH_DATABASE_URL=.*$/m, line)
    : `${current.replace(/\n?$/, '\n')}${line}\n`;
  writeFileSync(ENV_FILE, next);
  console.log(
    `Wrote SEARCH_DATABASE_URL to ${ENV_FILE}. Add the same value to your hosting provider's env vars.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
