import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import { getTokenStore } from "../../token-store";
import axios from "axios";
import {
  AlertUIBuilder,
  CardUIBuilder,
  OAuthUIBuilder,
} from "@dainprotocol/utils";

const TextStyleSchema = z.object({
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  fontSize: z.object({
    magnitude: z.number(),
    unit: z.enum(["PT"])
  }).optional()
});

const InputSchema = z.object({
  documentId: z.string().describe("The ID of the document to update"),
  startIndex: z.number().describe("The starting index of the text range"),
  endIndex: z.number().describe("The ending index of the text range"),
  style: TextStyleSchema.describe("The text style to apply")
});

export const updateTextStyleConfig: ToolConfig = {
  id: "update-text-style",
  name: "Update Text Style",
  description: "Updates the style of text in a specific range",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId, startIndex, endIndex, style }: z.infer<typeof InputSchema>,
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
              updateTextStyle: {
                range: {
                  startIndex,
                  endIndex
                },
                textStyle: style,
                fields: Object.keys(style).join(',')
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
        .title("Text Style Updated")
        .content(`
          Document ID: ${documentId}
          Range: ${startIndex} - ${endIndex}
          Style updated successfully
        `);

      return {
        text: "Text style updated successfully",
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error updating text style:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to update text style");

      return {
        text: "Error updating text style",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
