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
  documentId: z.string().describe("The ID of the document containing the table"),
  tableIndex: z.number().describe("The index of the table in the document"),
  columnIndex: z.number().describe("The column index where to insert the new column"),
  insertRight: z.boolean().optional().describe("Whether to insert to the right of the specified column")
});

export const insertTableColumnConfig: ToolConfig = {
  id: "insert-table-column",
  name: "Insert Table Column",
  description: "Inserts a column into an existing table",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId, tableIndex, columnIndex, insertRight }: z.infer<typeof InputSchema>,
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
              insertTableColumn: {
                tableCellLocation: {
                  tableStartLocation: {
                    index: tableIndex
                  },
                  columnIndex: columnIndex
                },
                insertRight: insertRight || false
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
        .title("Table Column Inserted")
        .content(`
          Document ID: ${documentId}
          Table Index: ${tableIndex}
          Column Index: ${columnIndex}
          Column inserted successfully
        `);

      return {
        text: "Table column inserted successfully",
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error inserting table column:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to insert table column");

      return {
        text: "Error inserting table column",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
