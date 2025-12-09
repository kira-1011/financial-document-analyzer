'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Download,
  FileQuestion,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '@/lib/documents/constants';
import { BankStatementView } from '@/components/extracted-data/bank-statement-view';
import { InvoiceView } from '@/components/extracted-data/invoice-view';
import { ReceiptView } from '@/components/extracted-data/receipt-view';
import type { Database } from '@/types/supabase';
import type { BankStatementData, InvoiceData, ReceiptData } from '@/lib/documents/schemas';

import { exportToCSV } from '@/lib/documents/export-csv';
import Image from 'next/image';
  
type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentDetailProps {
  document: Document;
  fileUrl: string | null;
}

export function DocumentDetail({ document, fileUrl }: DocumentDetailProps) {
  const [activeTab, setActiveTab] = useState('extracted');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
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

  const handleExportCSV = () => {
    if (!document.extractedData || !document.documentType) return;
    exportToCSV(document.documentType, document.extractedData, document.fileName);
  };

  const renderExtractedData = () => {
    if (!document.extractedData) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No extracted data</h3>
          <p className="text-muted-foreground">
            {document.status === 'processing'
              ? 'Document is being processed...'
              : document.status === 'failed'
                ? 'Extraction failed. Try reprocessing the document.'
                : 'Data extraction has not been completed yet.'}
          </p>
        </div>
      );
    }

    const data = document.extractedData as Record<string, unknown>;
    const docType = document.documentType as string | null;

    switch (docType) {
      case 'bank_statement':
        return <BankStatementView data={data as BankStatementData} />;
      case 'invoice':
        return <InvoiceView data={data as InvoiceData} />;
      case 'receipt':
        return <ReceiptView data={data as ReceiptData} />;
      case 'unknown':
        return (
          <div className="text-center py-12">
            <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Unknown Document Type</h3>
            <p className="text-muted-foreground">
              This document could not be classified as a supported financial document type.
              <br />
              Supported types: Bank Statements, Invoices, and Receipts.
            </p>
          </div>
        );
      default:
        return (
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
            {JSON.stringify(document.extractedData, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold truncate max-w-[400px]">{document.fileName}</h1>
              <Badge variant={getStatusBadgeVariant(document.status)} className="gap-1">
                {getStatusIcon(document.status)}
                {DOCUMENT_STATUS_LABELS[document.status as keyof typeof DOCUMENT_STATUS_LABELS] ||
                  document.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {document.documentType && (
                <span>
                  {DOCUMENT_TYPE_LABELS[document.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                </span>
              )}
              <span>{formatFileSize(document.fileSize)}</span>
              <span>
                Uploaded {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
              </span>
              {document.extractionConfidence && (
                <span>{Math.round(document.extractionConfidence * 100)}% confidence</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {document.status === 'completed' && document.extractedData && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          {fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {document.status === 'failed' && document.errorMessage && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4" />
              Processing Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{document.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="border bg-background">
          <TabsTrigger value="extracted" className="hover:text-primary!">
            Extracted Data
          </TabsTrigger>
          <TabsTrigger value="preview" className="hover:text-primary!">
            Document Preview
          </TabsTrigger>
          <TabsTrigger value="raw" className="hover:text-primary!">
            Raw JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extracted" className="space-y-4">
          {renderExtractedData()}
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>Original uploaded document</CardDescription>
            </CardHeader>
            <CardContent>
              {fileUrl ? (
                document.mimeType?.startsWith('image/') ? (
                  <Image
                    src={fileUrl}
                    alt={document.fileName}
                    className="max-w-full h-auto rounded-lg border"
                  />
                ) : (
                  <iframe
                    src={fileUrl}
                    className="w-full h-[800px] rounded-lg border"
                    title={document.fileName}
                  />
                )
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <p>Preview not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <CardTitle>Raw Extracted Data</CardTitle>
              <CardDescription>JSON representation of extracted data</CardDescription>
            </CardHeader>
            <CardContent>
              {document.extractedData ? (
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                  {JSON.stringify(document.extractedData, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No extracted data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Document Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Document ID</dt>
              <dd className="text-sm font-mono mt-1">{document.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">MIME Type</dt>
              <dd className="text-sm mt-1">{document.mimeType || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-muted-foreground">Processed At</dt>
              <dd className="text-sm mt-1">
                {document.processedAt ? format(new Date(document.processedAt), 'PPp') : '-'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
