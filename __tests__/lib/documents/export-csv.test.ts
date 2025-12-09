import { describe, it, expect } from 'vitest';
import { bankStatementToCSV, invoiceToCSV, receiptToCSV } from '@/lib/documents/export-csv';
import type { BankStatementData, InvoiceData, ReceiptData } from '@/lib/documents/schemas';

describe('CSV Export Functions', () => {
  describe('bankStatementToCSV', () => {
    const sampleBankStatement: BankStatementData = {
      bank_name: 'Test Bank',
      account_number: '****1234',
      account_holder: 'John Doe',
      statement_period: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      },
      opening_balance: 1000,
      closing_balance: 1500,
      total_credits: 600,
      total_debits: 100,
      currency: 'USD',
      transactions: [
        { date: '2024-01-15', description: 'Salary', amount: 500, type: 'credit', balance: 1500 },
        { date: '2024-01-20', description: 'Groceries', amount: -50, type: 'debit', balance: 1450 },
      ],
    };

    it('includes bank name in output', () => {
      const csv = bankStatementToCSV(sampleBankStatement);
      expect(csv).toContain('Bank Name,Test Bank');
    });

    it('includes account number', () => {
      const csv = bankStatementToCSV(sampleBankStatement);
      expect(csv).toContain('Account Number,****1234');
    });

    it('includes statement period', () => {
      const csv = bankStatementToCSV(sampleBankStatement);
      expect(csv).toContain('Statement Period,2024-01-01 to 2024-01-31');
    });

    it('includes transaction headers', () => {
      const csv = bankStatementToCSV(sampleBankStatement);
      expect(csv).toContain('Date,Description,Type,Amount,Balance');
    });

    it('includes transactions', () => {
      const csv = bankStatementToCSV(sampleBankStatement);
      expect(csv).toContain('2024-01-15,Salary,credit,500.00,1500.00');
    });

    it('formats amounts with 2 decimal places', () => {
      const csv = bankStatementToCSV(sampleBankStatement);
      expect(csv).toContain('1000.00'); // opening balance
      expect(csv).toContain('1500.00'); // closing balance
    });
  });

  describe('invoiceToCSV', () => {
    const sampleInvoice: InvoiceData = {
      invoice_number: 'INV-001',
      vendor_name: 'Acme Corp',
      vendor_address: '123 Main St',
      customer_name: 'Jane Smith',
      invoice_date: '2024-01-15',
      due_date: '2024-02-15',
      line_items: [
        { description: 'Consulting', quantity: 10, unit_price: 100, amount: 1000 },
        { description: 'Support', quantity: 5, unit_price: 50, amount: 250 },
      ],
      subtotal: 1250,
      tax_rate: 10,
      tax_amount: 125,
      total: 1375,
      currency: 'USD',
    };

    it('includes invoice number', () => {
      const csv = invoiceToCSV(sampleInvoice);
      expect(csv).toContain('Invoice Number,INV-001');
    });

    it('includes vendor information', () => {
      const csv = invoiceToCSV(sampleInvoice);
      expect(csv).toContain('Vendor,Acme Corp');
    });

    it('includes line item headers', () => {
      const csv = invoiceToCSV(sampleInvoice);
      expect(csv).toContain('Description,Quantity,Unit Price,Amount');
    });

    it('includes line items', () => {
      const csv = invoiceToCSV(sampleInvoice);
      expect(csv).toContain('Consulting,10,100.00,1000.00');
      expect(csv).toContain('Support,5,50.00,250.00');
    });

    it('includes tax information', () => {
      const csv = invoiceToCSV(sampleInvoice);
      expect(csv).toContain('Tax Rate,10%');
      expect(csv).toContain('Tax Amount,125.00');
    });
  });

  describe('receiptToCSV', () => {
    const sampleReceipt: ReceiptData = {
      merchant_name: 'Coffee Shop',
      merchant_address: '456 Oak Ave',
      receipt_date: '2024-01-15',
      receipt_time: '09:30',
      receipt_number: 'R-12345',
      items: [
        { name: 'Latte', quantity: 2, price: 5.0, amount: 10.0 },
        { name: 'Muffin', quantity: 1, price: 3.5, amount: 3.5 },
      ],
      subtotal: 13.5,
      tax_amount: 1.35,
      tip: 2.0,
      total: 16.85,
      payment_method: 'credit_card',
      card_last_four: '4242',
      currency: 'USD',
    };

    it('includes merchant name', () => {
      const csv = receiptToCSV(sampleReceipt);
      expect(csv).toContain('Merchant,Coffee Shop');
    });

    it('includes receipt date and time', () => {
      const csv = receiptToCSV(sampleReceipt);
      expect(csv).toContain('Date,2024-01-15');
      expect(csv).toContain('Time,09:30');
    });

    it('includes items header', () => {
      const csv = receiptToCSV(sampleReceipt);
      expect(csv).toContain('Item,Quantity,Price,Amount');
    });

    it('includes items', () => {
      const csv = receiptToCSV(sampleReceipt);
      expect(csv).toContain('Latte,2,5.00,10.00');
      expect(csv).toContain('Muffin,1,3.50,3.50');
    });

    it('includes payment method', () => {
      const csv = receiptToCSV(sampleReceipt);
      expect(csv).toContain('Payment Method,Credit Card');
    });

    it('includes tip when present', () => {
      const csv = receiptToCSV(sampleReceipt);
      expect(csv).toContain('Tip,2.00');
    });

    it('includes card last four digits', () => {
      const csv = receiptToCSV(sampleReceipt);
      expect(csv).toContain('Card Last Four,4242');
    });
  });

  describe('CSV escaping', () => {
    it('escapes values with commas', () => {
      const invoice: InvoiceData = {
        invoice_number: 'INV-001',
        vendor_name: 'Acme, Inc.',
        invoice_date: '2024-01-15',
        line_items: [],
        subtotal: 0,
        total: 0,
        currency: 'USD',
      };

      const csv = invoiceToCSV(invoice);
      expect(csv).toContain('"Acme, Inc."');
    });

    it('escapes values with quotes', () => {
      const receipt: ReceiptData = {
        merchant_name: 'Joe\'s "Best" Coffee',
        receipt_date: '2024-01-15',
        items: [],
        subtotal: 0,
        total: 0,
        currency: 'USD',
      };

      const csv = receiptToCSV(receipt);
      expect(csv).toContain('"Joe\'s ""Best"" Coffee"');
    });
  });
});
