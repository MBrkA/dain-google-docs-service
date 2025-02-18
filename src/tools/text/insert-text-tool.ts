import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../../token-store";
import axios from "axios";
import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const InputSchema = z.object({
  documentId: z.string().describe("The ID of the document to update"),
  text: z.string().describe("The text to insert"),
  location: z.number().describe("The index where to insert the text")
});

export const insertTextConfig: ToolConfig = {
  id: "insert-text",
  name: "Insert Text",
  description: "Inserts text at a specific location in a document",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId, text, location }: z.infer<typeof InputSchema>,
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
        `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
        {
          requests: [
            {
              insertText: {
                location: {
                  index: location
                },
                text: text
              }
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const cardUI = new CardUIBuilder()
        .title("Text Inserted")
        .content(`
          Document ID: ${documentId}
          Text: "${text}"
          Location: ${location}
          Text inserted successfully
        `);

      return {
        text: "Text inserted successfully",
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error inserting text:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to insert text");

      return {
        text: "Error inserting text",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
