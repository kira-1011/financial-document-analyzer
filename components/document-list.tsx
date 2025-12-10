'use client';

import * as React from 'react';
import { useActionState, startTransition } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  MoreHorizontal,
  Trash2,
  Download,
  ArrowUpDown,
  RefreshCw,
  User,
} from 'lucide-react';

import { usePolling } from '@/hooks/use-polling';
import { fetchDocumentStatuses, type DocumentStatus } from '@/lib/documents/api-client';
import { deleteDocumentAction, reprocessDocument } from '@/app/(dashboard)/documents/actions';
import { exportBulkToZip } from '@/lib/documents/export-csv';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
} from '@/lib/documents/constants';
import type { DocumentWithUploadedBy } from '@/lib/documents/api';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Document = DocumentWithUploadedBy;

interface DocumentListProps {
  initialDocuments: Document[];
  organizationId: string;
  canDelete: boolean;
}

const POLLING_INTERVAL = 20000;

// Helper functions
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusBadgeVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'processing':
      return 'secondary';
    default:
      return 'outline';
  }
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Create a separate RowActions component that uses useActionState
function RowActions({
  document,
  canDelete,
  onDeleteClick,
}: {
  document: Document;
  canDelete: boolean;
  onDeleteClick: (doc: Document) => void;
}) {
  const [_reprocessState, reprocessAction, isReprocessing] = useActionState(async () => {
    const result = await reprocessDocument(document.id);
    if (result.success) {
      toast.success('Document queued for reprocessing');
    } else {
      toast.error(result.error || 'Failed to reprocess');
    }
    return result;
  }, null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Reprocess option */}
        <DropdownMenuItem
          disabled={isReprocessing}
          onClick={(e) => {
            e.stopPropagation();
            startTransition(reprocessAction);
          }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isReprocessing ? 'animate-spin' : ''}`} />
          {isReprocessing ? 'Reprocessing...' : 'Reprocess'}
        </DropdownMenuItem>

        {/* Delete option - only if canDelete */}
        {canDelete && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(document);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DocumentList({ initialDocuments, organizationId, canDelete }: DocumentListProps) {
  const [documents, setDocuments] = React.useState<Document[]>(initialDocuments);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  // Delete dialog state (just for the dialog, not the action)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentsToDelete, setDocumentsToDelete] = React.useState<Document[]>([]);

  // useActionState for export
  const [, exportAction, isExporting] = useActionState(async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return null;

    const docsToExport = selectedRows.map((row) => row.original);

    try {
      await exportBulkToZip(docsToExport);
      const completedCount = docsToExport.filter(
        (d) => d.status === 'completed' && d.extractedData
      ).length;
      toast.success(`Exported ${completedCount} document(s) as ZIP`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    }
    return null;
  }, null);

  // useActionState for delete
  const [, deleteAction, isDeleting] = useActionState(async () => {
    if (documentsToDelete.length === 0) return null;

    const results = await Promise.all(documentsToDelete.map((doc) => deleteDocumentAction(doc.id)));

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      const deletedIds = documentsToDelete.filter((_, i) => results[i].success).map((d) => d.id);
      setDocuments((prev) => prev.filter((d) => !deletedIds.includes(d.id)));
      setRowSelection({});
      toast.success(`Deleted ${successCount} document(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} document(s)`);
    }

    setDeleteDialogOpen(false);
    setDocumentsToDelete([]);
    return null;
  }, null);

  // Sync when initialDocuments prop changes
  React.useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  // Polling for status updates
  const { data: statuses } = usePolling<DocumentStatus[]>({
    fetcher: () => fetchDocumentStatuses(organizationId),
    interval: POLLING_INTERVAL,
    enabled: true,
  });

  React.useEffect(() => {
    if (!statuses) return;
    setDocuments((prev) =>
      prev.map((doc) => {
        const updated = statuses.find((s) => s.id === doc.id);
        return updated ? { ...doc, ...updated } : doc;
      })
    );
  }, [statuses]);

  // Column definitions
  const columns: ColumnDef<Document>[] = React.useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'fileName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            File Name <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <Link
              href={`/documents/${row.original.id}`}
              className="truncate max-w-[200px] hover:underline"
            >
              {row.getValue('fileName')}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: 'documentType',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('documentType') as string | null;
          return type ? (
            <Badge variant="outline">
              {DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] || type}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <Badge variant={getStatusBadgeVariant(status)} className="gap-1">
              {getStatusIcon(status)}
              {DOCUMENT_STATUS_LABELS[status as keyof typeof DOCUMENT_STATUS_LABELS] || status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'fileSize',
        header: 'Size',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatFileSize(row.getValue('fileSize'))}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Uploaded <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(row.getValue('createdAt')), { addSuffix: true })}
          </span>
        ),
      },
      {
        accessorKey: 'uploadedBy',
        header: 'Uploaded By',
        cell: ({ row }) => {
          const uploadedBy = row.original.uploadedBy;
          return uploadedBy ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[120px]" title={uploadedBy.email}>
                {uploadedBy.name || uploadedBy.email}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          );
        },
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            document={row.original}
            canDelete={canDelete}
            onDeleteClick={(doc) => {
              setDocumentsToDelete([doc]);
              setDeleteDialogOpen(true);
            }}
          />
        ),
      },
    ],
    [canDelete]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: documents,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, rowSelection },
  });

  // Bulk delete handler - just opens the dialog
  const handleBulkDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    setDocumentsToDelete(selectedRows.map((row) => row.original));
    setDeleteDialogOpen(true);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No documents yet</h3>
        <p className="text-muted-foreground">Upload your first document to get started.</p>
      </div>
    );
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // Get current filter values
  const typeFilter = (table.getColumn('documentType')?.getFilterValue() as string) ?? 'all';
  const statusFilter = (table.getColumn('status')?.getFilterValue() as string) ?? 'all';

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <Input
            placeholder="Filter by file name..."
            value={(table.getColumn('fileName')?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn('fileName')?.setFilterValue(e.target.value)}
            className="max-w-sm"
          />

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              table.getColumn('documentType')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {DOCUMENT_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {DOCUMENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bulk Actions - only show when items are selected */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              {canDelete && (
                <Button variant="outline" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedCount})
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => startTransition(exportAction)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Exporting...' : `Export (${selectedCount})`}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          {selectedCount} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Dialog - updated for useActionState */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {documentsToDelete.length === 1 ? 'Document' : 'Documents'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {documentsToDelete.length === 1 ? (
                <>
                  Are you sure you want to delete &quot;{documentsToDelete[0]?.fileName}&quot;? This
                  action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete {documentsToDelete.length} documents? This action
                  cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => startTransition(deleteAction)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete${documentsToDelete.length > 1 ? ` (${documentsToDelete.length})` : ''}`
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
