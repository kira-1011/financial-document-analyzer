import { task } from '@trigger.dev/sdk/v3';
import { extractDocument } from '@/lib/documents/extract';
import { fetchDocument, updateDocument, getSignedUrlForFile } from '@/lib/documents/api';

export const processDocument = task({
  id: 'process-document',
  run: async (payload: { documentId: string }, { ctx }) => {
    const runId = ctx.run.id;

    console.log('processDocument runId', runId);

    // 1. Fetch document
    const document = await fetchDocument(payload.documentId);

    if (!document) {
      throw new Error(`Document not found: ${payload.documentId}`);
    }

    // 2. Update status to processing
    await updateDocument(payload.documentId, {
      status: 'processing',
      processedAt: new Date().toISOString(),
      runId,
    });

    try {
      // 3. Get signed URL for the file
      const signedUrl = await getSignedUrlForFile(document.filePath);

      const { classification, extractedData, aiModel } = await extractDocument(
        signedUrl,
        document.mimeType || ''
      );

      // 5. Update with results
      await updateDocument(payload.documentId, {
        documentType: classification.documentType,
        extractedData: extractedData,
        extractionConfidence: classification.confidence,
        aiModel,
        status: 'completed',
        processedAt: new Date().toISOString(),
      });

      return {
        success: true,
        documentType: classification.documentType,
        confidence: classification.confidence,
      };
    } catch (error) {
      await updateDocument(payload.documentId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unexpected error',
      });
      throw error;
    }
  },
});
