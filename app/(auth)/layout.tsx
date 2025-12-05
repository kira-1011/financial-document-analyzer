import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex relative">
            {/* Mode toggle - top right */}
            <div className="absolute top-4 right-4 z-50">
                <ModeToggle />
            </div>

            {/* left side - Auth form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-secondary">
                <div className="w-full max-w-sm">{children}</div>
            </div>

            {/* right side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-background relative overflow-hidden">
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Image
                                src="/docu-finance-logo.svg"
                                alt="DocuFinance Logo"
                                width={48}
                                height={48}
                                className="w-12 h-12"
                            />
                            <span className="text-2xl font-bold text-foreground tracking-tight">
                                DocuFinance
                            </span>
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-4">
                            AI-Powered Financial
                            <br />
                            <span className="text-primary">
                                Document Extraction
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md">
                            Extract key financial data from bank statements, invoices, and loan
                            documents with intelligent AI processing.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span className="text-muted-foreground">
                                Automated data extraction from PDFs
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span className="text-muted-foreground">
                                Secure organization-based access
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-primary" />
                            <span className="text-muted-foreground">
                                Search and query your documents
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

