-- ===========================================
-- DocuFinance: Documents Table Migration
-- ===========================================
-- Run AFTER Better Auth migrations:
--   pnpm dlx @better-auth/cli@latest migrate
-- ===========================================

-- Document status enum
CREATE TYPE "public"."document_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

-- Document type enum
CREATE TYPE "public"."document_type" AS ENUM (
    'bank_statement',
    'invoice',
    'receipt',
    'unknown'
);

-- Documents table
CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organizationId" "text" NOT NULL,
    "uploadedBy" "text" NOT NULL,
    "fileName" "text" NOT NULL,
    "filePath" "text" NOT NULL,
    "fileSize" integer,
    "mimeType" "text",
    "documentType" "public"."document_type",
    "status" "public"."document_status" DEFAULT 'pending' NOT NULL,
    "extractedData" "jsonb",
    "extractionConfidence" real,
    "aiModel" "text",
    "errorMessage" "text",
    "createdAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processedAt" timestamp with time zone,
    PRIMARY KEY ("id")
);

COMMENT ON TABLE "public"."documents" IS 'Financial documents uploaded for AI extraction';
COMMENT ON COLUMN "public"."documents"."extractedData" IS 'JSONB containing AI-extracted fields. Schema varies by document_type.';

-- Indexes for query performance
CREATE INDEX "idx_documents_org" ON "public"."documents" ("organizationId");
CREATE INDEX "idx_documents_uploaded_by" ON "public"."documents" ("uploadedBy");
CREATE INDEX "idx_documents_created" ON "public"."documents" ("createdAt" DESC);
CREATE INDEX "idx_documents_extracted_gin" ON "public"."documents" USING "gin" ("extractedData");

-- Foreign keys (references Better Auth tables)
ALTER TABLE "public"."documents"
    ADD CONSTRAINT "documents_organization_id_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE;

ALTER TABLE "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" 
    FOREIGN KEY ("uploadedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL;

-- Grants for Supabase roles
GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";
