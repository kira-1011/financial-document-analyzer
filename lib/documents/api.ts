import prisma from '@/lib/prisma';
import { deleteObject, getSignedDownloadUrl, putObject } from '@/lib/storage';
import { type documents, Prisma } from '@/prisma/generated/prisma/client';

export type Document = documents;

export type DocumentWithUploadedBy = Omit<Document, 'uploadedBy'> & {
  uploadedBy: { name: string; email: string; id: string } | null;
};

export type CreateDocumentInput = Pick<
  Prisma.documentsUncheckedCreateInput,
  | 'id'
  | 'organizationId'
  | 'uploadedBy'
  | 'fileName'
  | 'filePath'
  | 'fileSize'
  | 'mimeType'
  | 'status'
>;

export type UpdateDocumentInput = Omit<Prisma.documentsUncheckedUpdateInput, 'extractedData'> & {
  extractedData?: Prisma.InputJsonValue | null;
};

export async function fetchDocuments(organizationId: string): Promise<DocumentWithUploadedBy[]> {
  try {
    const rows = await prisma.documents.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return rows.map(({ user, ...document }) => ({ ...document, uploadedBy: user }));
  } catch (error) {
    console.error('[fetchDocuments] Error:', error);
    throw new Error('Failed to fetch documents');
  }
}

export async function fetchDocument(documentId: string): Promise<Document | null> {
  try {
    return await prisma.documents.findUnique({ where: { id: documentId } });
  } catch (error) {
    console.error('[fetchDocument] Error:', error);
    throw new Error('Failed to fetch document');
  }
}

export type DocumentStatus = Pick<Document, 'id' | 'status' | 'documentType'>;

export async function fetchDocumentStatuses(organizationId: string): Promise<DocumentStatus[]> {
  return prisma.documents.findMany({
    where: { organizationId },
    select: { id: true, status: true, documentType: true },
  });
}

export interface DocumentStats {
  total: number;
  byStatus: {
    completed: number;
    processing: number;
    pending: number;
    failed: number;
  };
  byType: {
    bank_statement: number;
    invoice: number;
    receipt: number;
    unknown: number;
  };
}

export async function fetchDocumentStats(organizationId: string): Promise<DocumentStats> {
  const [statusCounts, typeCounts] = await Promise.all([
    prisma.documents.groupBy({ by: ['status'], where: { organizationId }, _count: true }),
    prisma.documents.groupBy({ by: ['documentType'], where: { organizationId }, _count: true }),
  ]);

  const countStatus = (status: string) =>
    statusCounts.find((row) => row.status === status)?._count ?? 0;
  const countType = (type: string) =>
    typeCounts.find((row) => row.documentType === type)?._count ?? 0;

  return {
    total: statusCounts.reduce((sum, row) => sum + row._count, 0),
    byStatus: {
      completed: countStatus('completed'),
      processing: countStatus('processing'),
      pending: countStatus('pending'),
      failed: countStatus('failed'),
    },
    byType: {
      bank_statement: countType('bank_statement'),
      invoice: countType('invoice'),
      receipt: countType('receipt'),
      // Documents that haven't been classified yet count as unknown.
      unknown:
        countType('unknown') + (typeCounts.find((row) => row.documentType === null)?._count ?? 0),
    },
  };
}

export async function uploadFileToStorage(filePath: string, file: File): Promise<boolean> {
  try {
    await putObject(filePath, file);
    return true;
  } catch (error) {
    console.error('[uploadFileToStorage] Error:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
}

export async function createDocument(input: CreateDocumentInput): Promise<void> {
  try {
    await prisma.documents.create({ data: input });
  } catch (error) {
    console.error('[createDocument] Error:', error);
    throw new Error('Failed to save document. Please try again.');
  }
}

export async function updateDocument(id: string, payload: UpdateDocumentInput): Promise<void> {
  const { extractedData, ...rest } = payload;

  try {
    await prisma.documents.update({
      where: { id },
      data: {
        ...rest,
        ...(extractedData !== undefined && {
          extractedData: extractedData === null ? Prisma.DbNull : extractedData,
        }),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('[updateDocument] Error:', error);
    throw new Error('Failed to update document. Please try again.');
  }
}

export async function getSignedUrlForFile(filePath: string): Promise<string> {
  try {
    return await getSignedDownloadUrl(filePath, 3600);
  } catch (error) {
    console.error('[getSignedUrlForFile] Error:', error);
    throw new Error('Failed to get signed URL. Please try again.');
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const document = await fetchDocument(documentId);
    if (document?.filePath) {
      await deleteObject(document.filePath);
    }

    await prisma.documents.delete({ where: { id: documentId } });
  } catch (error) {
    console.error('[deleteDocument] Error:', error);
    throw new Error('Failed to delete document');
  }
}
