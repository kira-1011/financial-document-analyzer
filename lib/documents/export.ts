import type { Database } from '@/types/supabase';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from './constants';

type Document = Database['public']['Tables']['documents']['Row'];

interface ExportOptions {
  includeExtractedData?: boolean;
}

export function exportToCSV(documents: Document[], options: ExportOptions = {}) {
  const { includeExtractedData = false } = options;

  // Define headers
  const baseHeaders = [
    'ID',
    'File Name',
    'Document Type',
    'Status',
    'File Size (bytes)',
    'Uploaded At',
    'Processed At',
  ];

  const headers = includeExtractedData ? [...baseHeaders, 'Extracted Data (JSON)'] : baseHeaders;

  // Build rows
  const rows = documents.map((doc) => {
    const baseRow = [
      doc.id,
      doc.fileName,
      doc.documentType
        ? DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS] ||
          doc.documentType
        : '',
      DOCUMENT_STATUS_LABELS[doc.status as keyof typeof DOCUMENT_STATUS_LABELS] || doc.status,
      doc.fileSize?.toString() || '',
      doc.createdAt,
      doc.processedAt || '',
    ];

    if (includeExtractedData) {
      baseRow.push(doc.extractedData ? JSON.stringify(doc.extractedData) : '');
    }

    return baseRow;
  });

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
