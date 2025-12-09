import type { BankStatementData, InvoiceData, ReceiptData } from './schemas';
import JSZip from 'jszip';
import type { Database } from '@/types/supabase';

type Document = Database['public']['Tables']['documents']['Row'];

// Helper to escape CSV values (handle commas, quotes, newlines)
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to format currency values
function formatAmount(amount: number | undefined): string {
  if (amount === undefined) return '';
  return amount.toFixed(2);
}

// Convert Bank Statement to CSV
export function bankStatementToCSV(data: BankStatementData): string {
  const lines: string[] = [];

  // Summary section
  lines.push(`Bank Name,${escapeCSV(data.bank_name)}`);
  lines.push(`Account Number,${escapeCSV(data.account_number)}`);
  if (data.account_holder) {
    lines.push(`Account Holder,${escapeCSV(data.account_holder)}`);
  }
  lines.push(
    `Statement Period,${data.statement_period.start_date} to ${data.statement_period.end_date}`
  );
  lines.push(`Currency,${data.currency || 'USD'}`);
  lines.push(`Opening Balance,${formatAmount(data.opening_balance)}`);
  lines.push(`Closing Balance,${formatAmount(data.closing_balance)}`);
  if (data.total_credits !== undefined) {
    lines.push(`Total Credits,${formatAmount(data.total_credits)}`);
  }
  if (data.total_debits !== undefined) {
    lines.push(`Total Debits,${formatAmount(data.total_debits)}`);
  }

  // Blank row separator
  lines.push('');

  // Transactions header
  lines.push('Date,Description,Type,Amount,Balance');

  // Transaction rows
  for (const tx of data.transactions) {
    lines.push(
      [
        escapeCSV(tx.date),
        escapeCSV(tx.description),
        escapeCSV(tx.type),
        formatAmount(tx.amount),
        tx.balance !== undefined ? formatAmount(tx.balance) : '',
      ].join(',')
    );
  }

  return lines.join('\n');
}

// Convert Invoice to CSV
export function invoiceToCSV(data: InvoiceData): string {
  const lines: string[] = [];

  // Summary section
  lines.push(`Invoice Number,${escapeCSV(data.invoice_number)}`);
  lines.push(`Vendor,${escapeCSV(data.vendor_name)}`);
  if (data.vendor_address) {
    lines.push(`Vendor Address,${escapeCSV(data.vendor_address)}`);
  }
  if (data.customer_name) {
    lines.push(`Customer,${escapeCSV(data.customer_name)}`);
  }
  if (data.customer_address) {
    lines.push(`Customer Address,${escapeCSV(data.customer_address)}`);
  }
  lines.push(`Invoice Date,${escapeCSV(data.invoice_date)}`);
  if (data.due_date) {
    lines.push(`Due Date,${escapeCSV(data.due_date)}`);
  }
  lines.push(`Currency,${data.currency || 'USD'}`);
  lines.push(`Subtotal,${formatAmount(data.subtotal)}`);
  if (data.discount !== undefined && data.discount > 0) {
    lines.push(`Discount,${formatAmount(data.discount)}`);
  }
  if (data.tax_rate !== undefined) {
    lines.push(`Tax Rate,${data.tax_rate}%`);
  }
  if (data.tax_amount !== undefined) {
    lines.push(`Tax Amount,${formatAmount(data.tax_amount)}`);
  }
  lines.push(`Total,${formatAmount(data.total)}`);
  if (data.payment_terms) {
    lines.push(`Payment Terms,${escapeCSV(data.payment_terms)}`);
  }
  if (data.notes) {
    lines.push(`Notes,${escapeCSV(data.notes)}`);
  }

  // Blank row separator
  lines.push('');

  // Line items header
  lines.push('Description,Quantity,Unit Price,Amount');

  // Line item rows
  for (const item of data.line_items) {
    lines.push(
      [
        escapeCSV(item.description),
        String(item.quantity),
        formatAmount(item.unit_price),
        formatAmount(item.amount),
      ].join(',')
    );
  }

  return lines.join('\n');
}

// Convert Receipt to CSV
export function receiptToCSV(data: ReceiptData): string {
  const lines: string[] = [];

  // Summary section
  lines.push(`Merchant,${escapeCSV(data.merchant_name)}`);
  if (data.merchant_address) {
    lines.push(`Address,${escapeCSV(data.merchant_address)}`);
  }
  if (data.merchant_phone) {
    lines.push(`Phone,${escapeCSV(data.merchant_phone)}`);
  }
  lines.push(`Date,${escapeCSV(data.receipt_date)}`);
  if (data.receipt_time) {
    lines.push(`Time,${escapeCSV(data.receipt_time)}`);
  }
  if (data.receipt_number) {
    lines.push(`Receipt Number,${escapeCSV(data.receipt_number)}`);
  }
  lines.push(`Currency,${data.currency || 'USD'}`);
  lines.push(`Subtotal,${formatAmount(data.subtotal)}`);
  if (data.tax_amount !== undefined && data.tax_amount > 0) {
    lines.push(`Tax,${formatAmount(data.tax_amount)}`);
  }
  if (data.tip !== undefined && data.tip > 0) {
    lines.push(`Tip,${formatAmount(data.tip)}`);
  }
  lines.push(`Total,${formatAmount(data.total)}`);
  if (data.payment_method) {
    const methodLabels: Record<string, string> = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      other: 'Other',
    };
    lines.push(`Payment Method,${methodLabels[data.payment_method] || data.payment_method}`);
  }
  if (data.card_last_four) {
    lines.push(`Card Last Four,${escapeCSV(data.card_last_four)}`);
  }

  // Blank row separator
  lines.push('');

  // Items header
  lines.push('Item,Quantity,Price,Amount');

  // Item rows
  for (const item of data.items) {
    lines.push(
      [
        escapeCSV(item.name),
        String(item.quantity),
        formatAmount(item.price),
        formatAmount(item.amount),
      ].join(',')
    );
  }

  return lines.join('\n');
}

// Generate CSV content for a single document (without triggering download)
export function generateDocumentCSV(
  documentType: string | null,
  extractedData: unknown,
  fileName: string
): { content: string; name: string } | null {
  if (!documentType || !extractedData) {
    return null;
  }

  let csvContent: string;

  switch (documentType) {
    case 'bank_statement':
      csvContent = bankStatementToCSV(extractedData as BankStatementData);
      break;
    case 'invoice':
      csvContent = invoiceToCSV(extractedData as InvoiceData);
      break;
    case 'receipt':
      csvContent = receiptToCSV(extractedData as ReceiptData);
      break;
    default:
      csvContent = `Data\n"${JSON.stringify(extractedData).replace(/"/g, '""')}"`;
  }

  // Generate filename
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const csvFileName = `${documentType}_${baseName}.csv`;

  return { content: csvContent, name: csvFileName };
}

// Export single document as CSV (triggers download)
export function exportToCSV(documentType: string, extractedData: unknown, fileName: string): void {
  const result = generateDocumentCSV(documentType, extractedData, fileName);
  if (!result) return;

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + result.content], { type: 'text/csv;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Bulk export multiple documents as a ZIP file
export async function exportBulkToZip(documents: Document[]): Promise<void> {
  const zip = new JSZip();
  let exportedCount = 0;

  for (const doc of documents) {
    if (doc.status !== 'completed' || !doc.extractedData) {
      continue; // Skip documents without extracted data
    }

    const result = generateDocumentCSV(doc.documentType, doc.extractedData, doc.fileName);
    if (result) {
      // Add UTF-8 BOM for Excel compatibility
      const BOM = '\uFEFF';
      zip.file(result.name, BOM + result.content);
      exportedCount++;
    }
  }

  if (exportedCount === 0) {
    throw new Error('No completed documents with extracted data to export');
  }

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const date = new Date().toISOString().split('T')[0];
  const zipFileName = `documents-export-${date}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
