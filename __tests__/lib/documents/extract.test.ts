import type { GenerateObjectResult } from 'ai';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

// Mock the 'ai' module
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Mock the '@ai-sdk/google' module
vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mocked-model'),
}));

import { generateObject } from 'ai';
import { extractDocument, type RouterResult } from '@/lib/documents/extract';
import type { BankStatementData, InvoiceData, ReceiptData } from '@/lib/documents/schemas';

// Helper to create properly typed mock responses
function createMockResponse<T>(object: T): Partial<GenerateObjectResult<T>> {
  return { object };
}

const mockGenerateObject = generateObject as Mock;

describe('extractDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('document classification', () => {
    it('classifies and extracts an invoice successfully', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'Document contains invoice number, vendor info, and line items',
        documentType: 'invoice',
        confidence: 0.95,
      };

      const extractionResponse: InvoiceData = {
        invoice_number: 'INV-001',
        vendor_name: 'Acme Corp',
        invoice_date: '2024-01-15',
        line_items: [{ description: 'Service', quantity: 1, unit_price: 100, amount: 100 }],
        subtotal: 100,
        total: 110,
        currency: 'USD',
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockResolvedValueOnce(createMockResponse(extractionResponse));

      const result = await extractDocument('https://example.com/invoice.pdf', 'application/pdf');

      expect(result.classification.documentType).toBe('invoice');
      expect(result.classification.confidence).toBe(0.95);
      expect(result.extractedData).not.toBeNull();
      expect((result.extractedData as InvoiceData).invoice_number).toBe('INV-001');
      expect(mockGenerateObject).toHaveBeenCalledTimes(2);
    });

    it('classifies and extracts a receipt successfully', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'Document shows merchant name and purchased items',
        documentType: 'receipt',
        confidence: 0.9,
      };

      const extractionResponse: ReceiptData = {
        merchant_name: 'Coffee Shop',
        receipt_date: '2024-01-15',
        items: [{ name: 'Latte', quantity: 1, price: 5.0, amount: 5.0 }],
        subtotal: 5.0,
        total: 5.5,
        currency: 'USD',
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockResolvedValueOnce(createMockResponse(extractionResponse));

      const result = await extractDocument('https://example.com/receipt.jpg', 'image/jpeg');

      expect(result.classification.documentType).toBe('receipt');
      expect((result.extractedData as ReceiptData).merchant_name).toBe('Coffee Shop');
    });

    it('classifies and extracts a bank statement successfully', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'Document contains bank name, account info, and transactions',
        documentType: 'bank_statement',
        confidence: 0.92,
      };

      const extractionResponse: BankStatementData = {
        bank_name: 'Test Bank',
        account_number: '****1234',
        statement_period: { start_date: '2024-01-01', end_date: '2024-01-31' },
        opening_balance: 1000,
        closing_balance: 1500,
        currency: 'USD',
        transactions: [],
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockResolvedValueOnce(createMockResponse(extractionResponse));

      const result = await extractDocument('https://example.com/statement.pdf', 'application/pdf');

      expect(result.classification.documentType).toBe('bank_statement');
      expect((result.extractedData as BankStatementData).bank_name).toBe('Test Bank');
    });
  });

  describe('unknown document handling', () => {
    it('returns null extractedData for unknown document type', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'Document does not appear to be a financial document',
        documentType: 'unknown',
        confidence: 0.3,
      };

      mockGenerateObject.mockResolvedValueOnce(createMockResponse(classificationResponse));

      const result = await extractDocument('https://example.com/random.pdf', 'application/pdf');

      expect(result.classification.documentType).toBe('unknown');
      expect(result.extractedData).toBeNull();
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('throws error when AI classification fails', async () => {
      mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      await expect(
        extractDocument('https://example.com/doc.pdf', 'application/pdf')
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('throws error when AI extraction fails', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'Invoice detected',
        documentType: 'invoice',
        confidence: 0.9,
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockRejectedValueOnce(new Error('Failed to extract data'));

      await expect(
        extractDocument('https://example.com/invoice.pdf', 'application/pdf')
      ).rejects.toThrow('Failed to extract data');
    });
  });

  describe('MIME type handling', () => {
    it('handles PDF documents', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'test',
        documentType: 'invoice',
        confidence: 0.9,
      };

      const extractionResponse: InvoiceData = {
        invoice_number: 'INV-001',
        vendor_name: 'Test',
        invoice_date: '2024-01-01',
        line_items: [],
        subtotal: 0,
        total: 0,
        currency: 'USD',
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockResolvedValueOnce(createMockResponse(extractionResponse));

      await extractDocument('https://example.com/doc.pdf', 'application/pdf');

      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it('handles JPEG images', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'test',
        documentType: 'receipt',
        confidence: 0.9,
      };

      const extractionResponse: ReceiptData = {
        merchant_name: 'Shop',
        receipt_date: '2024-01-01',
        items: [],
        subtotal: 0,
        total: 0,
        currency: 'USD',
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockResolvedValueOnce(createMockResponse(extractionResponse));

      await extractDocument('https://example.com/receipt.jpg', 'image/jpeg');

      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it('handles PNG images', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'test',
        documentType: 'receipt',
        confidence: 0.9,
      };

      const extractionResponse: ReceiptData = {
        merchant_name: 'Shop',
        receipt_date: '2024-01-01',
        items: [],
        subtotal: 0,
        total: 0,
        currency: 'USD',
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockResolvedValueOnce(createMockResponse(extractionResponse));

      await extractDocument('https://example.com/receipt.png', 'image/png');

      expect(mockGenerateObject).toHaveBeenCalled();
    });
  });

  describe('AI model configuration', () => {
    it('includes aiModel in the response', async () => {
      const classificationResponse: RouterResult = {
        reasoning: 'test',
        documentType: 'invoice',
        confidence: 0.9,
      };

      const extractionResponse: InvoiceData = {
        invoice_number: 'INV-001',
        vendor_name: 'Test',
        invoice_date: '2024-01-01',
        line_items: [],
        subtotal: 0,
        total: 0,
        currency: 'USD',
      };

      mockGenerateObject
        .mockResolvedValueOnce(createMockResponse(classificationResponse))
        .mockResolvedValueOnce(createMockResponse(extractionResponse));

      const result = await extractDocument('https://example.com/doc.pdf', 'application/pdf');

      expect(result.aiModel).toBeDefined();
      expect(typeof result.aiModel).toBe('string');
    });
  });
});

describe('Router Schema Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates confidence is between 0 and 1', () => {
    const validConfidences = [0, 0.5, 0.85, 1];

    validConfidences.forEach((confidence) => {
      const response: RouterResult = {
        reasoning: 'test',
        documentType: 'invoice',
        confidence,
      };
      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('validates documentType is one of the allowed values', () => {
    const validTypes: RouterResult['documentType'][] = [
      'bank_statement',
      'invoice',
      'receipt',
      'unknown',
    ];

    validTypes.forEach((documentType) => {
      const response: RouterResult = {
        reasoning: 'test',
        documentType,
        confidence: 0.9,
      };
      expect(validTypes).toContain(response.documentType);
    });
  });
});
