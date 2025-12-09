import { CheckCircle } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { Brand } from '@/components/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex relative">
      {/* Mode toggle - top right */}
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>

      {/* left side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* right side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            {/* Use Brand component */}
            <div className="mb-6">
              <Brand size="lg" asLink={false} />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-4">
              AI-Powered Financial
              <br />
              <span className="text-primary">Document Extraction</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Extract key financial data from bank statements, invoices, and loan documents with
              intelligent AI processing.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-muted-foreground">Automated data extraction from PDFs</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-muted-foreground">Secure organization-based access</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-muted-foreground">Search and query your documents</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
