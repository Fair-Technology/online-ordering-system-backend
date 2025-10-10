declare namespace NodeJS {
  interface ProcessEnv {
    COSMOS_DB_ENDPOINT?: string;
    COSMOS_DB_KEY?: string;
    COSMOS_DB_DATABASE_ID?: string;
    COSMOS_DB_CONTAINER_ID?: string;
  }
}

// Extend the Azure Functions context.log signature to include .error
declare module "@azure/functions" {
  interface Context {
    log: {
      (msg?: any, ...params: any[]): void;
      error?: (msg?: any, ...params: any[]) => void;
      warn?: (msg?: any, ...params: any[]) => void;
    };
  }
}
