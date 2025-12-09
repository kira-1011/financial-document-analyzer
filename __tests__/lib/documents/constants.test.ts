import { describe, it, expect } from 'vitest';
import {
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from '@/lib/documents/constants';

describe('Document Constants', () => {
  describe('DOCUMENT_TYPES', () => {
    it('contains expected document types', () => {
      expect(DOCUMENT_TYPES).toContain('bank_statement');
      expect(DOCUMENT_TYPES).toContain('invoice');
      expect(DOCUMENT_TYPES).toContain('receipt');
      expect(DOCUMENT_TYPES).toContain('unknown');
    });

    it('has exactly 4 document types', () => {
      expect(DOCUMENT_TYPES).toHaveLength(4);
    });
  });

  describe('DOCUMENT_STATUS', () => {
    it('contains expected statuses', () => {
      expect(DOCUMENT_STATUS).toContain('pending');
      expect(DOCUMENT_STATUS).toContain('processing');
      expect(DOCUMENT_STATUS).toContain('completed');
      expect(DOCUMENT_STATUS).toContain('failed');
    });

    it('has exactly 4 statuses', () => {
      expect(DOCUMENT_STATUS).toHaveLength(4);
    });
  });

  describe('ALLOWED_MIME_TYPES', () => {
    it('allows PDF files', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    });

    it('allows image files', () => {
      expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
      expect(ALLOWED_MIME_TYPES).toContain('image/jpg');
      expect(ALLOWED_MIME_TYPES).toContain('image/png');
    });
  });

  describe('MAX_FILE_SIZE', () => {
    it('is set to 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('DOCUMENT_TYPE_LABELS', () => {
    it('has labels for all document types', () => {
      DOCUMENT_TYPES.forEach((type) => {
        expect(DOCUMENT_TYPE_LABELS[type]).toBeDefined();
        expect(typeof DOCUMENT_TYPE_LABELS[type]).toBe('string');
      });
    });

    it('has human-readable labels', () => {
      expect(DOCUMENT_TYPE_LABELS.bank_statement).toBe('Bank Statement');
      expect(DOCUMENT_TYPE_LABELS.invoice).toBe('Invoice');
      expect(DOCUMENT_TYPE_LABELS.receipt).toBe('Receipt');
      expect(DOCUMENT_TYPE_LABELS.unknown).toBe('Unknown Document');
    });
  });

  describe('DOCUMENT_STATUS_LABELS', () => {
    it('has labels for all statuses', () => {
      DOCUMENT_STATUS.forEach((status) => {
        expect(DOCUMENT_STATUS_LABELS[status]).toBeDefined();
        expect(typeof DOCUMENT_STATUS_LABELS[status]).toBe('string');
      });
    });
  });
});
