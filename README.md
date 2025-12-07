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
- 👥 **Team Collaboration** — Invite team members via email
- 📊 **Structured Output** — Clean JSON with transactions, line items, totals, and more
- 🔄 **Background Processing** — Reliable document processing with Trigger.dev
- 🎨 **Modern UI** — Beautiful, responsive interface with dark/light mode

## Supported Documents

| Document Type | Extracted Fields |
|--------------|------------------|
| **Bank Statement** | Bank name, account number, statement period, opening/closing balance, all transactions with dates, descriptions, and amounts |
| **Invoice** | Vendor info, invoice number, dates, line items with quantities and prices, subtotal, tax, total |
| **Receipt** | Merchant name, date, items purchased, payment method, subtotal, tax, total |

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **AI**: [Google Gemini 2.5 Flash](https://ai.google.dev/) via [Vercel AI SDK v5](https://sdk.vercel.ai/)
- **Authentication**: [Better Auth](https://better-auth.com/) with Organizations plugin
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **File Storage**: Supabase Storage
- **Background Jobs**: [Trigger.dev](https://trigger.dev/)
- **Email**: [Resend](https://resend.com/) with React Email
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account
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
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see [Environment Variables](#environment-variables)).

4. **Set up Supabase**

Create a new Supabase project and run the database migrations:

```bash
pnpm dlx supabase link
pnpm dlx supabase db push
```

Create a storage bucket named `documents` with the following settings:
- Public: No
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`
- Max file size: 10MB

5. **Generate TypeScript types**

```bash
pnpm run update-supabase-types
```

6. **Set up Trigger.dev**

```bash
pnpm dlx trigger.dev@latest init
pnpm dlx trigger.dev@latest dev
```

7. **Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `BETTER_AUTH_SECRET` | Random string for session encryption (min 32 chars) |
| `BETTER_AUTH_URL` | Your app URL (e.g., `http://localhost:3000`) |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Trusted origins for auth |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio API key |
| `AI_MODEL` | AI model to use (default: `gemini-2.5-flash-lite`) |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `EMAIL_FROM` | From address for emails |
| `TRIGGER_SECRET_KEY` | Trigger.dev secret key |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

## Database Schema

### Documents Table

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  user_id text not null,
  file_name text not null,
  file_path text not null,
  file_size integer not null,
  mime_type text not null,
  document_type document_type,
  status document_status default 'pending',
  extracted_data jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enums
create type document_type as enum ('bank_statement', 'invoice', 'receipt');
create type document_status as enum ('pending', 'processing', 'completed', 'failed');
```

## Project Structure

```
├── app/
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── documents/       # Document list and detail views
│   │   └── settings/        # User and organization settings
│   ├── accept-invitation/   # Invitation acceptance flow
│   └── api/auth/            # Better Auth API routes
├── components/
│   ├── email/               # React Email templates
│   ├── extracted-data/      # Document type-specific views
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── documents/           # Document processing logic
│   │   ├── extract.ts       # AI extraction with Gemini
│   │   ├── schemas.ts       # Zod schemas for each doc type
│   │   └── upload.ts        # File upload handling
│   ├── email/               # Email sending utilities
│   └── supabase/            # Supabase client setup
├── trigger/
│   └── process-document.ts  # Background job for AI processing
└── types/
    ├── index.ts             # Custom TypeScript types
    └── supabase.ts          # Generated Supabase types
```

## How It Works

1. **Upload** — User uploads a PDF or image of a financial document
2. **Store** — File is stored in Supabase Storage, record created in database
3. **Queue** — Background job is triggered via Trigger.dev
4. **Classify** — AI classifies the document type (bank statement, invoice, receipt)
5. **Extract** — AI extracts structured data using type-specific Zod schemas
6. **Save** — Extracted data is saved to the database
7. **Display** — User sees the structured data in a formatted view

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add all environment variables
4. Deploy

### Trigger.dev

Deploy your Trigger.dev tasks:

```bash
pnpm dlx trigger.dev@latest deploy
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) for the excellent AI integration
- [Better Auth](https://better-auth.com/) for authentication
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Trigger.dev](https://trigger.dev/) for reliable background jobs

---

<p align="center">
  Made with ❤️ by the open source community
</p>
