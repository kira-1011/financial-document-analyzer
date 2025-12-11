import { describe, expect, it } from 'vitest';
import {
  bankStatementSchema,
  bankStatementTransactionSchema,
  invoiceLineItemSchema,
  invoiceSchema,
  receiptItemSchema,
  receiptSchema,
} from '@/lib/documents/schemas';

describe('Document Schemas', () => {
  describe('bankStatementTransactionSchema', () => {
    it('validates a valid transaction', () => {
      const validTransaction = {
        date: '2024-01-15',
        description: 'Payment received',
        amount: 100.5,
        type: 'credit',
        balance: 1500.0,
      };

      const result = bankStatementTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it('rejects invalid transaction type', () => {
      const invalidTransaction = {
        date: '2024-01-15',
        description: 'Test',
        amount: 100,
        type: 'invalid',
      };

      const result = bankStatementTransactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });

    it('allows optional balance field', () => {
      const transaction = {
        date: '2024-01-15',
        description: 'Test',
        amount: 100,
        type: 'debit',
      };

      const result = bankStatementTransactionSchema.safeParse(transaction);
      expect(result.success).toBe(true);
    });
  });

  describe('bankStatementSchema', () => {
    const validBankStatement = {
      bank_name: 'Test Bank',
      account_number: '****1234',
      statement_period: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      },
      opening_balance: 1000,
      closing_balance: 1500,
      currency: 'USD',
      transactions: [],
    };

    it('validates a valid bank statement', () => {
      const result = bankStatementSchema.safeParse(validBankStatement);
      expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
      const invalid = { bank_name: 'Test Bank' };
      const result = bankStatementSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('defaults currency to USD', () => {
      const withoutCurrency = {
        ...validBankStatement,
        currency: undefined,
      };
      delete (withoutCurrency as Record<string, unknown>).currency;

      const result = bankStatementSchema.safeParse(withoutCurrency);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('USD');
      }
    });
  });

  describe('invoiceLineItemSchema', () => {
    it('validates a valid line item', () => {
      const validItem = {
        description: 'Consulting Services',
        quantity: 10,
        unit_price: 150,
        amount: 1500,
      };

      const result = invoiceLineItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const invalid = { description: 'Test' };
      const result = invoiceLineItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('invoiceSchema', () => {
    const validInvoice = {
      invoice_number: 'INV-001',
      vendor_name: 'Acme Corp',
      invoice_date: '2024-01-15',
      line_items: [{ description: 'Service', quantity: 1, unit_price: 100, amount: 100 }],
      subtotal: 100,
      total: 110,
    };

    it('validates a valid invoice', () => {
      const result = invoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('allows optional fields', () => {
      const result = invoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.due_date).toBeUndefined();
        expect(result.data.tax_rate).toBeUndefined();
      }
    });
  });

  describe('receiptItemSchema', () => {
    it('validates a valid receipt item', () => {
      const validItem = {
        name: 'Coffee',
        quantity: 2,
        price: 4.5,
        amount: 9.0,
      };

      const result = receiptItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('defaults quantity to 1', () => {
      const item = {
        name: 'Coffee',
        price: 4.5,
        amount: 4.5,
      };

      const result = receiptItemSchema.safeParse(item);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(1);
      }
    });
  });

  describe('receiptSchema', () => {
    const validReceipt = {
      merchant_name: 'Coffee Shop',
      receipt_date: '2024-01-15',
      items: [{ name: 'Latte', quantity: 1, price: 5.0, amount: 5.0 }],
      subtotal: 5.0,
      total: 5.5,
    };

    it('validates a valid receipt', () => {
      const result = receiptSchema.safeParse(validReceipt);
      expect(result.success).toBe(true);
    });

    it('validates payment method enum', () => {
      const withPayment = {
        ...validReceipt,
        payment_method: 'credit_card',
      };

      const result = receiptSchema.safeParse(withPayment);
      expect(result.success).toBe(true);
    });

    it('rejects invalid payment method', () => {
      const invalid = {
        ...validReceipt,
        payment_method: 'bitcoin',
      };

      const result = receiptSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
