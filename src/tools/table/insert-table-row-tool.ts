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
  rowIndex: z.number().describe("The row index where to insert the new row"),
  insertBelow: z.boolean().optional().describe("Whether to insert below the specified row")
});

export const insertTableRowConfig: ToolConfig = {
  id: "insert-table-row",
  name: "Insert Table Row",
  description: "Inserts a row into an existing table",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId, tableIndex, rowIndex, insertBelow }: z.infer<typeof InputSchema>,
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
              insertTableRow: {
                tableCellLocation: {
                  tableStartLocation: {
                    index: tableIndex
                  },
                  rowIndex: rowIndex
                },
                insertBelow: insertBelow || false
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
        .title("Table Row Inserted")
        .content(`
          Document ID: ${documentId}
          Table Index: ${tableIndex}
          Row Index: ${rowIndex}
          Row inserted successfully
        `);

      return {
        text: "Table row inserted successfully",
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error inserting table row:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to insert table row");

      return {
        text: "Error inserting table row",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
