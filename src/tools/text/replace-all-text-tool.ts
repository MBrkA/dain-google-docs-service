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
  searchText: z.string().describe("The text to search for and replace"),
  replaceText: z.string().describe("The text to replace matches with"),
  matchCase: z.boolean().optional().describe("Whether to match case when searching")
});

export const replaceAllTextConfig: ToolConfig = {
  id: "replace-all-text",
  name: "Replace All Text",
  description: "Replaces all instances of text in a document",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId, searchText, replaceText, matchCase }: z.infer<typeof InputSchema>,
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
              replaceAllText: {
                containsText: {
                  text: searchText,
                  matchCase: matchCase || false
                },
                replaceText: replaceText
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
        .title("Text Replaced")
        .content(`
          Document ID: ${documentId}
          Replaced: "${searchText}"
          With: "${replaceText}"
          Occurrences changed: ${response.data.replies[0].replaceAllText.occurrencesChanged}
        `);

      return {
        text: "Text replaced successfully",
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error replacing text:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to replace text");

      return {
        text: "Error replacing text",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
