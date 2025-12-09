import { supabase } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type Document = Database['public']['Tables']['documents']['Row'];

export async function fetchDocuments(organizationId: string): Promise<Document[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[fetchDocuments] Error:', error);
      throw new Error('Failed to fetch documents');
    }

    return data || [];
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
  completed: number;
  processing: number;
  pending: number;
  failed: number;
}

export async function fetchDocumentStats(organizationId: string): Promise<DocumentStats> {
  // Fetch all counts in parallel
  const [totalResult, completedResult, processingResult, pendingResult, failedResult] =
    await Promise.all([
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId),
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId)
        .eq('status', 'completed'),
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId)
        .eq('status', 'processing'),
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId)
        .eq('status', 'pending'),
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('organizationId', organizationId)
        .eq('status', 'failed'),
    ]);

  return {
    total: totalResult.count || 0,
    completed: completedResult.count || 0,
    processing: processingResult.count || 0,
    pending: pendingResult.count || 0,
    failed: failedResult.count || 0,
  };
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
