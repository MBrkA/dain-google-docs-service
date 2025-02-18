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
  rowIndex: z.number().describe("The index of the row to delete")
});

export const deleteTableRowConfig: ToolConfig = {
  id: "delete-table-row",
  name: "Delete Table Row",
  description: "Deletes a row from an existing table",
  input: InputSchema,
  output: z.any(),
  handler: async (
    { documentId, tableIndex, rowIndex }: z.infer<typeof InputSchema>,
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
              deleteTableRow: {
                tableCellLocation: {
                  tableStartLocation: {
                    index: tableIndex
                  },
                  rowIndex: rowIndex
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
        .title("Table Row Deleted")
        .content(`
          Document ID: ${documentId}
          Table Index: ${tableIndex}
          Row Index: ${rowIndex}
          Row deleted successfully
        `);

      return {
        text: "Table row deleted successfully",
        data: response.data,
        ui: cardUI.build(),
      };
    } catch (error) {
      console.error("Error deleting table row:", error);
      const alertUI = new AlertUIBuilder()
        .variant("error")
        .message("Failed to delete table row");

      return {
        text: "Error deleting table row",
        data: undefined,
        ui: alertUI.build(),
      };
    }
  },
};
