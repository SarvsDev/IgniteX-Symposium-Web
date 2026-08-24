export interface GoogleFormConfig {
  formId: string;
  formUrl: string;
  responderUri: string;
  createdAt: string;
  ownerEmail: string;
}

export async function requestWorkspaceAccessToken(): Promise<string | null> {
  return null;
}

export async function createIgniteXGoogleForm(
  accessToken?: string | null,
  ownerEmail?: string
): Promise<GoogleFormConfig | null> {
  return null;
}
