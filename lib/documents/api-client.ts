'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { type DocumentStatus, fetchDocumentStatuses as fetchStatuses } from './api';

export type { DocumentStatus };

// Called by the document list to poll processing status. Runs on the server
// and only answers for the caller's active organization.
export async function fetchDocumentStatuses(organizationId: string): Promise<DocumentStatus[]> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.session.activeOrganizationId !== organizationId) {
    return [];
  }

  return fetchStatuses(organizationId);
}
