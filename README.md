<p align="center">
  <img src="public/docu-finance-logo.svg" alt="DocuFinance Logo" width="80" height="80">
</p>

<h1 align="center">DocuFinance</h1>

<p align="center">
  <strong>AI-Powered Financial Document Extractor</strong>
</p>

<p align="center">
  Extract structured data from bank statements, invoices, and receipts using AI.
  <br />
  No more manual data entry. Upload a document and get clean, structured JSON in seconds.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#environment-variables">Environment Variables</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#license">License</a>
</p>

---

## Features

- 📄 **Multi-Document Support** — Bank statements, invoices, and receipts
- 🤖 **AI-Powered Extraction** — Uses Google Gemini to extract structured data
- 🏢 **Multi-Tenant** — Organizations with role-based access (owner, admin, member)
- 👥 **Members** — Invite organization members via email
- 📊 **Structured Output** — Clean JSON with transactions, line items, totals, and more
- 🔄 **Background Processing** — Reliable document processing with Trigger.dev
- 🎨 **Modern UI** — Shadcn for responsive interface with dark/light mode

## Supported Documents

| Document Type      | Extracted Fields                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Bank Statement** | Bank name, account number, statement period, opening/closing balance, all transactions with dates, descriptions, and amounts |
| **Invoice**        | Vendor info, invoice number, dates, line items with quantities and prices, subtotal, tax, total                              |
| **Receipt**        | Merchant name, date, items purchased, payment method, subtotal, tax, total                                                   |

## Tech Stack

| Technology                                    | Description                              | Docs                                                  |
| --------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| [Next.js 16](https://nextjs.org/)             | React framework with App Router          | [Documentation](https://nextjs.org/docs)              |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript                     | [Documentation](https://www.typescriptlang.org/docs/) |
| [Tailwind CSS](https://tailwindcss.com/)      | Utility-first CSS framework              | [Documentation](https://tailwindcss.com/docs)         |
| [shadcn/ui](https://ui.shadcn.com/)           | Beautifully designed components          | [Documentation](https://ui.shadcn.com/docs)           |
| [AI SDK](https://ai-sdk.dev/)                 | Vercel AI SDK for structured AI outputs  | [Documentation](https://ai-sdk.dev/docs)              |
| [Better Auth](https://www.better-auth.com/)   | Authentication with Organizations plugin | [Documentation](https://www.better-auth.com/docs)     |
| [Neon](https://neon.com/)                     | Postgres database & object storage       | [Documentation](https://neon.com/docs)                |
| [Trigger.dev](https://trigger.dev/)           | Background job processing                | [Documentation](https://trigger.dev/docs)             |
| [Resend](https://resend.com/)                 | Transactional emails                     | [Documentation](https://resend.com/docs)              |
| [Vitest](https://vitest.dev/)                 | Fast unit testing framework              | [Documentation](https://vitest.dev/guide/)            |
| [Zod](https://zod.dev/)                       | Schema validation                        | [Documentation](https://zod.dev/)                     |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm (recommended) or npm
- Neon account
- Google AI API key
- Trigger.dev account
- Resend account (for emails)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/financial-document-analyzer.git
cd financial-document-analyzer
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables)).

4. **Set up Neon**

The `neon.ts` file declares a Postgres database and a private `documents` bucket. Link it to your Neon project, provision it, and pull the connection strings and storage credentials into `.env.local`:

```bash
pnpm dlx neon@latest login
pnpm dlx neon@latest link --project-id <your-project-id>
pnpm dlx neon@latest deploy
```

5. **Run the database migrations**

```bash
pnpm db:migrate
```

6. **Create the search role**

The chat assistant turns questions into SQL. That SQL runs as a separate login role with no table access, against a temporary table holding only the current organization's documents. Create the role and write `SEARCH_DATABASE_URL` to `.env.local`:

```bash
pnpm db:search-role
```

Run it once per Neon branch. Running it again rotates the password.

7. **Set up Trigger.dev**

```bash
pnpm dlx trigger.dev@latest init
pnpm dlx trigger.dev@latest dev
```

9. **Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

This project uses [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit testing.

```bash
# Run tests in watch mode
pnpm test

# Run tests once (CI)
pnpm test:run
```

Tests are located in the `__tests__/` directory and cover:

- Document schemas validation
- CSV export functions
- AI extraction service (mocked)
- Component rendering

## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting — a fast, unified toolchain written in Rust.

```bash
# Lint and format (all-in-one)
pnpm exec biome check --write

# Lint only
pnpm exec biome lint .

# Format only
pnpm exec biome format --write .

# Check without writing (CI)
pnpm exec biome ci .
```

Pre-commit hooks run automatically via Husky.

## CI/CD

GitHub Actions workflows run on every PR and push to `main`:

- **Test** (`test.yml`) — Runs Vitest unit tests
- **Lint & Format** (`lint.yml`) — Runs Biome checks

Branch protection rules ensure all checks pass before merging.

## Environment Variables

Create a `.env.local` file with the following variables:

| Variable                        | Description                                         |
| ------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`                  | Neon pooled connection string (from `neon deploy`)  |
| `DATABASE_URL_UNPOOLED`         | Neon direct connection string, used for migrations  |
| `SEARCH_DATABASE_URL`           | Search role connection string (`pnpm db:search-role`) |
| `AWS_ENDPOINT_URL_S3`           | Neon object storage endpoint (from `neon deploy`)   |
| `AWS_ACCESS_KEY_ID`             | Neon object storage access key                      |
| `AWS_SECRET_ACCESS_KEY`         | Neon object storage secret key                      |
| `AWS_REGION`                    | Neon object storage region                          |
| `STORAGE_BUCKET`                | Optional bucket name (default: `documents`)         |
| `BETTER_AUTH_SECRET`            | Random string for session encryption (min 32 chars) |
| `BETTER_AUTH_URL`               | Your app URL (e.g., `http://localhost:3000`)        |
| `BETTER_AUTH_TRUSTED_ORIGINS`   | Trusted origins for auth                            |
| `GOOGLE_GENERATIVE_AI_API_KEY`  | Google AI Studio API key                            |
| `AI_MODEL`                      | AI model to use (default: `gemini-2.5-flash-lite`)  |
| `RESEND_API_KEY`                | Resend API key for sending emails                   |
| `EMAIL_FROM`                    | From address for emails                             |
| `TRIGGER_SECRET_KEY`            | Trigger.dev secret key                              |
| `NEXT_PUBLIC_APP_URL`           | Public app URL                                      |
| `GOOGLE_CLIENT_ID`              | Google OAuth client ID (sign in with Google)        |
| `GOOGLE_CLIENT_SECRET`          | Google OAuth client secret                          |

## Database Schema

### Documents Table

```sql
-- Enums
CREATE TYPE document_type AS ENUM ('bank_statement', 'invoice', 'receipt', 'unknown');
CREATE TYPE document_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  "uploadedBy" TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "documentType" document_type,
  status document_status DEFAULT 'pending' NOT NULL,
  "extractedData" JSONB,
  "extractionConfidence" REAL,
  "aiModel" TEXT,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "processedAt" TIMESTAMPTZ
);
```

The full schema, including the Better Auth tables (`user`, `organization`, `member`, `session`, etc.), lives in `prisma/schema.prisma` and is created by `pnpm db:migrate`.

## Project Structure

```
├── .github/
│   └── workflows/                 # CI/CD pipelines
│       ├── lint.yml               # Biome lint & format checks
│       └── test.yml               # Vitest unit tests
├── __tests__/                     # Unit tests
│   ├── components/                # Component tests
│   │   └── brand.test.tsx
│   └── lib/
│       └── documents/             # Document logic tests
│           ├── constants.test.ts
│           ├── export-csv.test.ts
│           ├── extract.test.ts
│           └── schemas.test.ts
├── app/
│   ├── (auth)/                    # Auth pages (login, signup)
│   │   ├── actions.ts             # Auth server actions
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/               # Protected dashboard pages
│   │   ├── actions.ts             # Dashboard server actions
│   │   ├── documents/             # Document list and detail views
│   │   │   ├── [id]/              # Single document view
│   │   │   └── actions.ts         # Document server actions
│   │   └── settings/              # User and organization settings
│   │       ├── profile/
│   │       └── organization/
│   ├── accept-invitation/         # Team invitation acceptance
│   └── api/auth/                  # Better Auth API routes
├── components/
│   ├── email/                     # React Email templates
│   ├── extracted-data/            # Document type-specific views
│   │   ├── bank-statement-view.tsx
│   │   ├── invoice-view.tsx
│   │   └── receipt-view.tsx
│   ├── ui/                        # shadcn/ui components
│   ├── app-sidebar.tsx            # Main navigation sidebar
│   ├── document-detail.tsx        # Document detail view
│   ├── document-list.tsx          # Document list with actions
│   ├── document-stats.tsx         # Dashboard statistics
│   ├── organization-switcher.tsx  # Organization selector
│   └── upload-document-dialog.tsx # File upload dialog
├── hooks/
│   ├── use-mobile.ts              # Mobile detection hook
│   └── use-polling.ts             # Polling hook for status updates
├── lib/
│   ├── documents/                 # Document processing logic
│   │   ├── api.ts                 # Document API functions
│   │   ├── api-client.ts          # Client-side API utilities
│   │   ├── constants.ts           # Document types & status enums
│   │   ├── export-csv.ts          # CSV export functionality
│   │   ├── extract.ts             # AI router + extraction workflow
│   │   ├── prompts.ts             # System prompts for AI
│   │   ├── schemas.ts             # Zod schemas for each doc type
│   │   └── upload.ts              # File upload handling
│   ├── email/                     # Email sending utilities
│   │   ├── resend.ts              # Resend client
│   │   └── send-email.ts          # Email sending functions
│   ├── auth.ts                    # Better Auth configuration
│   ├── auth-client.ts             # Client-side auth
│   ├── auth-types.ts              # Auth type definitions
│   ├── permissions.ts             # Role-based access control
│   ├── prisma.ts                  # Prisma client (Neon pooled connection)
│   ├── storage.ts                 # Neon object storage (S3 API)
│   └── utils.ts                   # Utility functions (cn, etc.)
├── trigger/
│   └── process-document.ts        # Background job for AI processing
├── types/
│   └── index.ts                   # Custom TypeScript types
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── scripts/
│   └── create-search-role.ts      # Creates the chat assistant's search role
├── neon.ts                        # Neon services (Postgres, documents bucket)
├── vitest.config.mts              # Vitest configuration
├── vitest.setup.ts                # Test setup file
├── biome.json                     # Biome linting & formatting config
└── trigger.config.ts              # Trigger.dev configuration
```

## How It Works

1. **Upload** — User uploads a PDF or image of a financial document
2. **Store** — File is stored in Neon object storage, record created in Postgres
3. **Queue** — Background job is triggered via Trigger.dev
4. **Classify** — AI classifies the document type (bank statement, invoice, receipt)
5. **Extract** — AI extracts structured data using type-specific Zod schemas
6. **Save** — Extracted data is saved to the database
7. **Display** — User sees the structured data in a formatted view

### AI Router Workflow

The document extraction uses a **routing workflow pattern** from the [AI SDK](https://ai-sdk.dev/docs/agents/workflows#routing):

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   Upload    │────▶│  Router Agent   │────▶│  Specialized Agent   │
│  Document   │     │  (Classifier)   │     │    (Extractor)       │
└─────────────┘     └─────────────────┘     └──────────────────────┘
                            │                         │
                            ▼                         ▼
                    ┌───────────────┐         ┌─────────────┐
                    │ Document Type │         │  Extracted  │
                    │ + Confidence  │         │    Data     │
                    └───────────────┘         └─────────────┘
```

**Step 1: Router Classification**

- The router agent analyzes the document and classifies it as `bank_statement`, `invoice`, or `receipt`
- Returns a confidence score (0-1) for the classification

**Step 2: Specialized Extraction**

- Based on the classification, the document is routed to a specialized extractor
- Each extractor has its own Zod schema and system prompt optimized for that document type
- Returns fully structured, validated data

This pattern ensures accurate extraction by using document-type-specific schemas rather than a one-size-fits-all approach.

> 📖 Learn more: [AI SDK Routing Workflows](https://ai-sdk.dev/docs/agents/workflows#routing)

## Deployment

### Database

Run the migrations and create the search role against the Neon branch you deploy to (production here):

```bash
pnpm db:migrate
pnpm db:search-role
```

`pnpm db:search-role` prints no secrets. It writes `SEARCH_DATABASE_URL` to `.env.local`, so copy the value from there. Running it again rotates the password, so update Vercel afterwards.

### Vercel

Set these for the Production environment (and Preview, if you use preview deployments), copying the values from `.env.local`:

| Variable                                                                         | Notes                                          |
| -------------------------------------------------------------------------------- | ---------------------------------------------- |
| `DATABASE_URL`                                                                   | Neon pooled connection (host ends in `-pooler`) |
| `SEARCH_DATABASE_URL`                                                            | From `pnpm db:search-role`                     |
| `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | Neon object storage                            |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`                   | `BETTER_AUTH_URL` is your production URL       |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                       | Google sign-in                                 |
| `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_MODEL`                                       | Gemini                                         |
| `RESEND_API_KEY`                                                                 | Invitation emails                              |
| `TRIGGER_SECRET_KEY`                                                             | Starting background jobs                       |

`DATABASE_URL_UNPOOLED` is only needed where you run migrations, not in Vercel. Environment variable changes take effect on the next deployment, so redeploy after changing them.

### Trigger.dev

The document processing task runs on Trigger.dev, not Vercel, so it needs its own copy of the variables it uses. In the Trigger.dev dashboard, set `DATABASE_URL`, the four `AWS_*` variables, `GOOGLE_GENERATIVE_AI_API_KEY` and `AI_MODEL` for the production environment, then deploy the tasks:

```bash
pnpm dlx trigger.dev@4.8.10 deploy
```

Keep the CLI version in step with `@trigger.dev/sdk` in `package.json`.

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
