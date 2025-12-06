"use client";

import { UploadDocumentDialog } from "@/components/upload-document-dialog";

export default function DocumentsPage() {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Documents</h1>
                <UploadDocumentDialog />
            </div>
            
            {/* Document list will go here */}
            <p className="text-muted-foreground">No documents yet.</p>
        </div>
    );
}
