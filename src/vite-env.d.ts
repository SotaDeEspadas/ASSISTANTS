/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_AD_CLIENT_ID: string;
  readonly VITE_AZURE_AD_TENANT_ID: string;
  readonly VITE_AZURE_AD_AUTHORITY: string;
  readonly VITE_AZURE_AD_REDIRECT_URI: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DATVERSE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    __ASSISTANTS_CONFIG__: {
      azureAd: {
        clientId: string;
        tenantId: string;
        authority: string;
        redirectUri: string;
      };
      api: {
        baseUrl: string;
      };
      dataverse: {
        url: string;
      };
    };
  }
}
