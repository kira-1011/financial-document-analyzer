import {
  FileText,
  CheckCircle,
  Loader2,
  XCircle,
  Landmark,
  FileSpreadsheet,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DocumentStats } from '@/lib/documents/api';

interface DocumentStatsProps {
  stats: DocumentStats;
}

export function DocumentStatsCards({ stats }: DocumentStatsProps) {
  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Total"
          value={stats.total}
          className="bg-primary/10 text-primary"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label="Completed"
          value={stats.byStatus.completed}
          className="bg-green-500/10 text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={<Loader2 className="h-4 w-4" />}
          label="Processing"
          value={stats.byStatus.processing}
          className="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label="Failed"
          value={stats.byStatus.failed}
          className="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Document Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Landmark className="h-4 w-4" />}
          label="Bank Statements"
          value={stats.byType.bank_statement}
          variant="outline"
        />
        <StatCard
          icon={<FileSpreadsheet className="h-4 w-4" />}
          label="Invoices"
          value={stats.byType.invoice}
          variant="outline"
        />
        <StatCard
          icon={<Receipt className="h-4 w-4" />}
          label="Receipts"
          value={stats.byType.receipt}
          variant="outline"
        />
        <StatCard
          icon={<HelpCircle className="h-4 w-4" />}
          label="Unknown"
          value={stats.byType.unknown}
          variant="outline"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  className?: string;
  variant?: 'default' | 'outline';
}

function StatCard({ icon, label, value, className, variant = 'default' }: StatCardProps) {
  return (
    <Card className={variant === 'outline' ? 'border-dashed' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 justify-between">
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <div className={`p-2 rounded-lg ${className || 'bg-muted'}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
