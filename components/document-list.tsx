"use client";

import { useState, useEffect } from "react";
import { usePolling } from "@/hooks/use-polling";
import { fetchDocumentStatuses, type DocumentStatus } from "@/lib/documents/api-client";
import { organization } from "@/lib/auth-client";
import Link from "next/link";
import { FileText, Clock, CheckCircle, XCircle, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/documents/constants";
import { deleteDocumentAction } from "@/lib/documents/actions";
import type { Database } from "@/types/supabase";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface DocumentListProps {
    initialDocuments: Document[];
    organizationId: string;
}

const POLLING_INTERVAL = 20000;

export function DocumentList({ initialDocuments, organizationId }: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [canDeleteDocuments, setCanDeleteDocuments] = useState(false);

    // Check delete permission on mount
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const result = await organization.hasPermission({
                    permissions: {
                        document: ["delete"],
                    } as Record<string, string[]>,
                });
                setCanDeleteDocuments(result.data?.success ?? false);
            } catch (error) {
                console.error("Failed to check permission:", error);
                setCanDeleteDocuments(false);
            }
        };
        
        checkPermission();
    }, []);

    const { data: statuses } = usePolling<DocumentStatus[]>({
        fetcher: () => fetchDocumentStatuses(organizationId),
        interval: POLLING_INTERVAL,
        enabled: true,
    });

    // Merge status updates into documents
    useEffect(() => {
        if (!statuses) return;
        
        setDocuments((prev) =>
            prev.map((doc) => {
                const updated = statuses.find((s) => s.id === doc.id);
                return updated ? { ...doc, ...updated } : doc;
            })
        );
    }, [statuses]);

    // Delete handlers
    const handleDeleteClick = (e: React.MouseEvent, doc: Document) => {
        e.preventDefault();
        e.stopPropagation();
        setDocumentToDelete(doc);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return;
        
        setIsDeleting(true);
        const result = await deleteDocumentAction(documentToDelete.id);
        setIsDeleting(false);
        
        if (result.success) {
            toast.success("Document deleted successfully");
            setDocuments((prev) => prev.filter((d) => d.id !== documentToDelete.id));
        } else {
            toast.error(result.error || "Failed to delete document");
        }
        
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No documents yet</h3>
                <p className="text-muted-foreground">
                    Upload your first document to get started.
                </p>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4" />;
            case "failed":
                return <XCircle className="h-4 w-4" />;
            case "processing":
                return <Loader2 className="h-4 w-4 animate-spin" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "completed":
                return "default";
            case "failed":
                return "destructive";
            case "processing":
                return "secondary";
            default:
                return "outline";
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "-";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded</TableHead>
                            {canDeleteDocuments && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow 
                                key={doc.id} 
                                className="relative hover:bg-muted/50"
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <Link 
                                            href={`/documents/${doc.id}`}
                                            className="truncate max-w-[200px] after:absolute after:inset-0"
                                        >
                                            {doc.fileName}
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {doc.documentType ? (
                                        <Badge variant="outline">
                                            {DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS] || doc.documentType}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(doc.status)} className="gap-1">
                                        {getStatusIcon(doc.status)}
                                        {DOCUMENT_STATUS_LABELS[doc.status as keyof typeof DOCUMENT_STATUS_LABELS] || doc.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatFileSize(doc.fileSize)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </TableCell>
                                {canDeleteDocuments && (
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-8 w-8 relative z-10"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => handleDeleteClick(e, doc)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{documentToDelete?.fileName}&quot;? 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
