// Document types supported by the application
export const DOCUMENT_TYPES = ["bank_statement", "invoice", "receipt"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Document processing status
export const DOCUMENT_STATUS = ["pending", "processing", "completed", "failed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUS)[number];

// Allowed MIME types for upload (matching Supabase bucket config)
export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
] as const;

// Maximum file size in bytes (10MB - matching Supabase bucket config)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Human-readable document type labels
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    bank_statement: "Bank Statement",
    invoice: "Invoice",
    receipt: "Receipt",
};

// Human-readable status labels
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    pending: "Pending",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
};


export const AI_MODEL = "gemini-2.0-flash";