import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../token-store";
import axios from "axios";
import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const InputSchema = z.object({
  documentId: z.string().describe("The ID of the document to retrieve"),
});

export const getDocumentConfig: ToolConfig = {
  id: "get-document",
  name: "Get Document",
  description: "Retrieves a Google Doc by ID",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId }: z.infer<typeof InputSchema>,
    agentInfo,
    { app }
  ) => {
    const tokens = getTokenStore().getToken(agentInfo.id);

    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("google", agentInfo.id);
      if (!authUrl) {
        throw new Error("Failed to generate authentication URL");
      }
      const oauthUI = new OAuthUIBuilder()
        .title("Google Authentication")
        .content("Please authenticate with Google Docs")
        .logo(
          "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png"
        )
        .url(authUrl)
        .provider("google");

      return {
        text: "Authentication required",
        data: undefined,
        ui: oauthUI.build(),
      };
    }

    try {
      const response = await axios.get(
        `https://docs.googleapis.com/v1/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Document Details")
        .content(`
          Title: ${response.data.title}
          Document ID: ${response.data.documentId}
          Link: https://docs.google.com/document/d/${response.data.documentId}
        `);

      return {
        text: `Retrieved document: ${response.data.title}`,
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error retrieving document:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to retrieve document");

      return {
        text: "Error retrieving document",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
