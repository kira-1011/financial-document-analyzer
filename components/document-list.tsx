'use client';

import * as React from 'react';
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
} from 'lucide-react';

import { usePolling } from '@/hooks/use-polling';
import { fetchDocumentStatuses, type DocumentStatus } from '@/lib/documents/api-client';
import { deleteDocumentAction } from '@/lib/documents/actions';
import { exportToCSV, downloadCSV } from '@/lib/documents/export';
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
} from '@/lib/documents/constants';
import type { Database } from '@/types/supabase';

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

type Document = Database['public']['Tables']['documents']['Row'];

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

export function DocumentList({ initialDocuments, organizationId, canDelete }: DocumentListProps) {
  const [documents, setDocuments] = React.useState<Document[]>(initialDocuments);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] = React.useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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
      ...(canDelete
        ? [
            {
              id: 'actions',
              enableHiding: false,
              cell: ({ row }: { row: { original: Document } }) => (
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
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocumentToDelete(row.original);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            },
          ]
        : []),
    ],
    [canDelete]
  );

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

  // Export handler
  const handleExport = (includeExtractedData: boolean) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const docsToExport =
      selectedRows.length > 0 ? selectedRows.map((row) => row.original) : documents;

    const csv = exportToCSV(docsToExport, { includeExtractedData });
    const filename = `documents-export-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
    toast.success(`Exported ${docsToExport.length} document(s)`);
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;
    setIsDeleting(true);
    const result = await deleteDocumentAction(documentToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success('Document deleted successfully');
      setDocuments((prev) => prev.filter((d) => d.id !== documentToDelete.id));
    } else {
      toast.error(result.error || 'Failed to delete document');
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
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

          {/* Export Button - pushed to right */}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedCount > 0 && `(${selectedCount})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport(false)}>
                  Export CSV (Basic)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(true)}>
                  Export CSV (With Extracted Data)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{documentToDelete?.fileName}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
