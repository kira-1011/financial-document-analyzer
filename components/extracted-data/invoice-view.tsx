'use client';

import { format } from 'date-fns';
import { Building2, User, Calendar, FileText, Receipt } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InvoiceData } from '@/lib/documents/schemas';

interface InvoiceViewProps {
  data: InvoiceData;
}

export function InvoiceView({ data }: InvoiceViewProps) {
  const formatCurrency = (amount: number) => {
    // Handle invalid currency codes (symbols like "$" instead of "USD")
    const currencyCode = data.currency && data.currency.length === 3 ? data.currency : 'USD';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Number</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.invoice_number}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoice Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(data.invoice_date)}</div>
            {data.due_date && (
              <p className="text-xs text-muted-foreground">Due: {formatDate(data.due_date)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
            <p className="text-xs text-muted-foreground">
              {data.line_items.length} item{data.line_items.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currency || 'USD'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor and Customer */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              From (Vendor)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold">{data.vendor_name}</p>
              {data.vendor_address && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {data.vendor_address}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              To (Customer)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="font-semibold">{data.customer_name || '-'}</p>
              {data.customer_address && (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {data.customer_address}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>
            {data.line_items.length} item{data.line_items.length !== 1 ? 's' : ''} on this invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.line_items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(data.subtotal)}</TableCell>
                </TableRow>
                {data.discount !== undefined && data.discount > 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">
                      Discount
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      -{formatCurrency(data.discount)}
                    </TableCell>
                  </TableRow>
                )}
                {data.tax_amount !== undefined && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-right">
                      Tax {data.tax_rate ? `(${data.tax_rate}%)` : ''}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(data.tax_amount)}</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="text-right font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(data.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      {(data.payment_terms || data.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.payment_terms && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Payment Terms</h4>
                <p className="mt-1">{data.payment_terms}</p>
              </div>
            )}
            {data.payment_terms && data.notes && <Separator />}
            {data.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                <p className="mt-1 whitespace-pre-line">{data.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
