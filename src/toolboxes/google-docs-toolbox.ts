import { ToolboxConfig } from "@dainprotocol/service-sdk";
import { createDocumentConfig } from "../tools/create-document-tool";
import { getDocumentConfig } from "../tools/get-document-tool";
import { updateDocumentConfig } from "../tools/update-document-tool";

export const googleDocsToolbox: ToolboxConfig = {
  id: "google-docs-toolbox",
  name: "Google Docs Toolbox",
  description: "Collection of tools for working with Google Docs",
  tools: [
    createDocumentConfig.id,
    getDocumentConfig.id,
    updateDocumentConfig.id,
  ],
  metadata: {
    complexity: "Medium",
    applicableFields: ["Document Management", "Content Creation"],
  },
  recommendedPrompt: `Use this toolbox to create, retrieve, and update Google Docs documents.`,
};
