'use server';

import { tasks } from '@trigger.dev/sdk/v3';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createDocument, uploadFileToStorage } from '@/lib/documents/api';
import type { processDocument } from '@/trigger/process-document';
import type { UploadDocumentState } from '@/types';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './constants';

// Single file upload - used by batch upload
export async function uploadSingleDocument(file: File): Promise<{
  success: boolean;
  documentId?: string;
  error?: string;
}> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { success: false, error: 'Invalid file type' };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File too large (max 10MB)' };
  }

  // Get session and active organization
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  const activeOrg = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!activeOrg) {
    return { success: false, error: 'No active organization' };
  }

  const documentId = crypto.randomUUID();
  const filePath = `${activeOrg.id}/${documentId}/${file.name}`;

  try {
    await uploadFileToStorage(filePath, file);

    await createDocument({
      id: documentId,
      organizationId: activeOrg.id,
      uploadedBy: session.user.id,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      status: 'pending',
    });

    await tasks.trigger<typeof processDocument>('process-document', { documentId });

    return { success: true, documentId };
  } catch (error) {
    console.error('[uploadSingleDocument] Error:', error);
    return { success: false, error: 'Upload failed' };
  }
}

// Batch upload - processes multiple files
export async function uploadBatchDocuments(formData: FormData): Promise<{
  total: number;
  successful: number;
  failed: number;
}> {
  const files = formData.getAll('files') as File[];

  let successful = 0;
  let failed = 0;

  for (const file of files) {
    const result = await uploadSingleDocument(file);
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  revalidatePath('/documents');

  return { total: files.length, successful, failed };
}

// Keep existing uploadDocumentAction for backwards compatibility
export async function uploadDocumentAction(
  prevState: UploadDocumentState,
  formData: FormData
): Promise<UploadDocumentState> {
  // Get the file from form data
  const file = formData.get('file') as File | null;

  // Validate file exists
  if (!file || file.size === 0) {
    return {
      errors: { file: ['Please select a file to upload'] },
    };
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      errors: {
        file: ['Invalid file type. Please upload a PDF, JPEG, or PNG file'],
      },
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      errors: {
        file: ['File size exceeds 10MB limit'],
      },
    };
  }

  // Get session and active organization
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      message: 'You must be logged in to upload documents',
    };
  }

  const activeOrg = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!activeOrg) {
    return {
      message: 'No active organization. Please select an organization first.',
    };
  }

  // Generate unique document ID
  const documentId = crypto.randomUUID();

  // Create file path: {organizationId}/{documentId}/{filename}
  const filePath = `${activeOrg.id}/${documentId}/${file.name}`;

  try {
    // upload file to storage
    await uploadFileToStorage(filePath, file);

    // Insert document record into database (status: pending, no document_type yet)
    await createDocument({
      id: documentId,
      organizationId: activeOrg.id,
      uploadedBy: session.user.id,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
      status: 'pending',
    });
    // Trigger background processing task
    await tasks.trigger<typeof processDocument>('process-document', { documentId });

    // Revalidate documents page
    revalidatePath('/documents');

    return {
      success: true,
      message: 'Document uploaded successfully. Processing started.',
      documentId,
    };
  } catch (error) {
    console.error('[uploadDocument] Unexpected error:', error);
    return {
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}
