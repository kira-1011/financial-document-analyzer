"use client";

import { format } from "date-fns";
import { Store, Calendar, Clock, Receipt, CreditCard, Hash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { ReceiptData } from "@/lib/documents/schemas";

interface ReceiptViewProps {
    data: ReceiptData;
}

export function ReceiptView({ data }: ReceiptViewProps) {
    const formatCurrency = (amount: number) => {
        // Handle invalid currency codes (symbols like "$" instead of "USD")
        const currencyCode = data.currency && data.currency.length === 3
            ? data.currency
            : "USD";

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode,
        }).format(amount);
    };
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return "-";
        try {
            return format(new Date(dateStr), "MMM d, yyyy");
        } catch {
            return dateStr;
        }
    };

    const getPaymentMethodLabel = (method: string | undefined) => {
        if (!method) return null;
        const labels: Record<string, string> = {
            cash: "Cash",
            credit_card: "Credit Card",
            debit_card: "Debit Card",
            other: "Other",
        };
        return labels[method] || method;
    };

    return (
        <div className="space-y-6">
            {/* Header Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Merchant</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{data.merchant_name}</div>
                        {data.merchant_phone && (
                            <p className="text-xs text-muted-foreground">{data.merchant_phone}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Date & Time</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{formatDate(data.receipt_date)}</div>
                        {data.receipt_time && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {data.receipt_time}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.total)}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.items.length} item{data.items.length !== 1 ? "s" : ""}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {data.payment_method && (
                                <Badge variant="secondary">
                                    {getPaymentMethodLabel(data.payment_method)}
                                </Badge>
                            )}
                            {data.card_last_four && (
                                <span className="text-sm text-muted-foreground">
                                    •••• {data.card_last_four}
                                </span>
                            )}
                        </div>
                        {!data.payment_method && !data.card_last_four && (
                            <span className="text-muted-foreground">-</span>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Receipt Number & Address */}
            <div className="grid gap-4 md:grid-cols-2">
                {data.receipt_number && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Receipt Number
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-mono text-lg">{data.receipt_number}</p>
                        </CardContent>
                    </Card>
                )}

                {data.merchant_address && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                Store Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm whitespace-pre-line">{data.merchant_address}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Items Purchased</CardTitle>
                    <CardDescription>
                        {data.items.length} item{data.items.length !== 1 ? "s" : ""} on this receipt
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50%]">Item</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                                    <TableCell className="text-right">{formatCurrency(data.subtotal)}</TableCell>
                                </TableRow>
                                {data.tax_amount !== undefined && data.tax_amount > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-right">Tax</TableCell>
                                        <TableCell className="text-right">{formatCurrency(data.tax_amount)}</TableCell>
                                    </TableRow>
                                )}
                                {data.tip !== undefined && data.tip > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-right">Tip</TableCell>
                                        <TableCell className="text-right">{formatCurrency(data.tip)}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="bg-muted/50">
                                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(data.total)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

