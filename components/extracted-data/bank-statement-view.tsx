'use client';

import { format } from 'date-fns';
import { Building2, Calendar, TrendingDown, TrendingUp, User, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BankStatementData } from '@/lib/documents/schemas';

interface BankStatementViewProps {
  data: BankStatementData;
}

export function BankStatementView({ data }: BankStatementViewProps) {
  const formatCurrency = (amount: number) => {
    // Handle invalid currency codes (symbols like "$" instead of "USD")
    const currencyCode = data.currency && data.currency.length === 3 ? data.currency : 'USD';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const netChange = data.closing_balance - data.opening_balance;
  const netChangePercent = ((netChange / data.opening_balance) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.bank_name}</div>
            <p className="text-xs text-muted-foreground">Account: {data.account_number}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statement Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(data.statement_period.start_date)}</div>
            <p className="text-xs text-muted-foreground">
              to {formatDate(data.statement_period.end_date)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.closing_balance)}</div>
            <p className="text-xs text-muted-foreground">
              Opening: {formatCurrency(data.opening_balance)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            {netChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {netChange >= 0 ? '+' : ''}
              {formatCurrency(netChange)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netChange >= 0 ? '+' : ''}
              {netChangePercent}% from opening
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Holder */}
      {data.account_holder && (
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Account Holder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{data.account_holder}</p>
          </CardContent>
        </Card>
      )}

      {/* Credits/Debits Summary */}
      {(data.total_credits || data.total_debits) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.total_credits !== undefined && (
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{formatCurrency(data.total_credits)}
                </div>
              </CardContent>
            </Card>
          )}
          {data.total_debits !== undefined && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  -{formatCurrency(data.total_debits)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {data.transactions.length} transaction{data.transactions.length !== 1 ? 's' : ''} in
            this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.transactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{tx.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.type === 'credit' ? 'default' : 'secondary'}
                          className={
                            tx.type === 'credit'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }
                        >
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {formatCurrency(Math.abs(tx.amount))}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {tx.balance !== undefined ? formatCurrency(tx.balance) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No transactions found in this statement.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
