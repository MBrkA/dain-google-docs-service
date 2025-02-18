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
  documentId: z.string().describe("The ID of the document to insert table into"),
  rows: z.number().describe("Number of rows in the table"),
  columns: z.number().describe("Number of columns in the table"),
  location: z.number().optional().describe("Index where to insert the table")
});

export const insertTableConfig: ToolConfig = {
  id: "insert-table",
  name: "Insert Table",
  description: "Inserts a table into a Google Doc",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId, rows, columns, location }: z.infer<typeof InputSchema>,
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
              insertTable: {
                rows,
                columns,
                location: {
                  index: location || 1
                }
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
        .title("Table Inserted")
        .content(`
          Document ID: ${documentId}
          Rows: ${rows}
          Columns: ${columns}
          Table inserted successfully
        `);

      return {
        text: "Table inserted successfully",
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error inserting table:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to insert table");

      return {
        text: "Error inserting table",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
