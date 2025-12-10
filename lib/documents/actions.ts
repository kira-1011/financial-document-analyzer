'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { deleteDocument, updateDocument, fetchDocument } from './api';
import { runs } from '@trigger.dev/sdk/v3';

export async function deleteDocumentAction(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check permission
    const hasPermission = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permissions: {
          document: ['delete'],
        },
      },
    });

    if (!hasPermission.success) {
      return { success: false, error: "You don't have permission to delete documents" };
    }

    await deleteDocument(documentId);
    revalidatePath('/documents');

    return { success: true };
  } catch (error) {
    console.error('[deleteDocumentAction] Error:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

export async function reprocessDocument(
  documentId: string
): Promise<{ success: boolean; error?: string }> {
  try {

    // Fetch document to get existing run ID
    const document = await fetchDocument(documentId);
    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    // Try replay if we have a previous run ID
    if (document.runId) {
      await runs.replay(document.runId);
    }

    return { success: true };
  } catch (error) {
    console.error('[reprocessDocumentAction] Error:', error);
    return { success: false, error: 'Failed to reprocess document' };
  }
}
