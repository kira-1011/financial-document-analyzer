import { supabase } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type Document = Database['public']['Tables']['documents']['Row'];

// Add new type for document with uploader info
export type DocumentWithUploadedBy = Document & {
  uploadedBy: { name: string; email: string; id: string } | null;
};

export async function fetchDocuments(organizationId: string): Promise<DocumentWithUploadedBy[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(
        `
        *,
        uploadedBy:user!uploadedBy(name, email, id)
      `
      )
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[fetchDocuments] Error:', error);
      throw new Error('Failed to fetch documents');
    }

    return (data || []) as DocumentWithUploadedBy[];
  } catch (error) {
    console.error('[fetchDocuments] Error:', error);
    throw error;
  }
}

export async function fetchDocument(documentId: string): Promise<Document | null> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('[fetchDocument] Error:', error);
      throw new Error('Failed to fetch document');
    }

    return data || null;
  } catch (error) {
    console.error('[fetchDocument] Error:', error);
    throw error;
  }
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
  // Fetch documents with just the fields we need for counting
  const { data, error } = await supabase
    .from('documents')
    .select('status, documentType')
    .eq('organizationId', organizationId);

  if (error) {
    console.error('[fetchDocumentStats] Error:', error);
    throw new Error('Failed to fetch document stats');
  }

  const docs = data || [];

  // Calculate counts
  const stats: DocumentStats = {
    total: docs.length,
    byStatus: {
      completed: docs.filter((d) => d.status === 'completed').length,
      processing: docs.filter((d) => d.status === 'processing').length,
      pending: docs.filter((d) => d.status === 'pending').length,
      failed: docs.filter((d) => d.status === 'failed').length,
    },
    byType: {
      bank_statement: docs.filter((d) => d.documentType === 'bank_statement').length,
      invoice: docs.filter((d) => d.documentType === 'invoice').length,
      receipt: docs.filter((d) => d.documentType === 'receipt').length,
      unknown: docs.filter((d) => d.documentType === 'unknown' || !d.documentType).length,
    },
  };

  return stats;
}

export async function uploadFileToStorage(filePath: string, file: File): Promise<boolean> {
  try {
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      console.error('[uploadDocument] Storage error:', uploadError);
      throw new Error('Failed to upload file. Please try again.');
    }

    return true;
  } catch (error) {
    console.error('[uploadFileToStorage] Error:', error);
    throw error;
  }
}

const deleteFileFromStorage = async (filePath: string): Promise<void> => {
  try {
    await supabase.storage.from('documents').remove([filePath]);
  } catch (error) {
    console.error('[deleteFileFromStorage] Error:', error);
    throw error;
  }
};

export async function createDocument({
  id,
  organizationId,
  uploadedBy,
  fileName,
  filePath,
  fileSize,
  mimeType,
  status,
}: Database['public']['Tables']['documents']['Insert']): Promise<void> {
  try {
    const { error } = await supabase.from('documents').insert({
      id,
      organizationId,
      uploadedBy,
      fileName,
      filePath,
      fileSize,
      mimeType,
      status,
    });

    if (error) {
      console.error('[createDocument] Database error:', error);
      throw new Error('Failed to save document. Please try again.');
    }
  } catch (error) {
    console.error('[createDocument] Error:', error);
    throw error;
  }
}

export async function updateDocument(
  id: Database['public']['Tables']['documents']['Row']['id'],
  payload: Database['public']['Tables']['documents']['Update']
): Promise<void> {
  try {
    const { error } = await supabase.from('documents').update(payload).eq('id', id);

    if (error) {
      console.error('[updateDocument] Database error:', error);
      throw new Error('Failed to update document. Please try again.');
    }
  } catch (error) {
    console.error('[updateDocument] Error:', error);
    throw error;
  }
}

export async function getSignedUrlForFile(filePath: string): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('[getSignedUrlForFile] Error:', error);
      throw new Error('Failed to get signed URL. Please try again.');
    }

    return data.signedUrl || '';
  } catch (error) {
    console.error('[getSignedUrlForFile] Error:', error);
    throw error;
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    // Delete from storage first
    const document = await fetchDocument(documentId);
    if (document?.filePath) {
      await deleteFileFromStorage(document.filePath);
    }

    // Delete from database
    const { error } = await supabase.from('documents').delete().eq('id', documentId);

    if (error) {
      console.error('[deleteDocument] Error:', error);
      throw new Error('Failed to delete document');
    }
  } catch (error) {
    console.error('[deleteDocument] Error:', error);
    throw error;
  }
}
