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
  title: z.string().describe("The title of the document"),
  content: z.string().optional().describe("Initial content of the document"),
});

export const createDocumentConfig: ToolConfig = {
  id: "create-document",
  name: "Create Document",
  description: "Creates a new Google Doc",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { title, content }: z.infer<typeof InputSchema>,
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
      const response = await axios.post(
        "https://docs.googleapis.com/v1/documents",
        {
          title,
          body: content
            ? {
                content: [
                  {
                    paragraph: {
                      elements: [
                        {
                          textRun: {
                            content: content,
                          },
                        },
                      ],
                    },
                  },
                ],
              }
            : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Document Created")
        .content(`
          Title: ${title}
          Document ID: ${response.data.documentId}
          Link: https://docs.google.com/document/d/${response.data.documentId}
        `);

      return {
        text: `Created document: ${title}`,
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error creating document:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to create document");

      return {
        text: "Error creating document",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
