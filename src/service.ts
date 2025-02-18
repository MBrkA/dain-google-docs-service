import { createOAuth2Tool, defineDAINService } from "@dainprotocol/service-sdk";
import { getTokenStore } from "./token-store";
import { createDocumentConfig } from "./tools/create-document-tool";
import { getDocumentConfig } from "./tools/get-document-tool";
import { updateDocumentConfig } from "./tools/update-document-tool";
import { googleDocsToolbox } from "./toolboxes/google-docs-toolbox";
import { insertTableRowConfig } from "./tools/table/insert-table-row-tool";
import { deleteTableRowConfig } from "./tools/table/delete-table-row-tool";
import { insertTableColumnConfig } from "./tools/table/insert-table-column-tool";
import { insertTableConfig } from "./tools/table/insert-table-tool";

export const dainService = defineDAINService({
  metadata: {
    title: "Google Docs Integration",
    description: "A DAIN service for interacting with Google Docs",
    version: "1.0.0",
    author: "DAIN Protocol",
    tags: ["docs", "google"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    createOAuth2Tool("google"),
    createDocumentConfig,
    getDocumentConfig,
    updateDocumentConfig,
    insertTableColumnConfig,
    insertTableRowConfig,
    deleteTableRowConfig,
    insertTableConfig,
  ],
  toolboxes: [googleDocsToolbox],
  oauth2: {
    baseUrl: process.env.TUNNEL_URL || "http://localhost:2022",
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: [
          "https://www.googleapis.com/auth/documents",
          "email",
          "profile",
        ],
        onSuccess: async (agentId, tokens) => {
          console.log("Completed OAuth flow for agent", agentId, tokens);
          getTokenStore().setToken(agentId, tokens);
          console.log(`Stored tokens for agent ${agentId}`);
        },
      },
    },
  },
});
