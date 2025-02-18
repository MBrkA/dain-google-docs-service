# Google Docs DAIN Integration

This DAIN service provides integration with Google Docs, allowing you to create, retrieve, and update Google Docs documents.

## Features

- Create new Google Docs documents
- Retrieve existing documents by ID
- Update document content
- OAuth2 authentication with Google
- Comprehensive error handling
- UI components for better user interaction

## Setup

1. Set required environment variables:
   - DAIN_API_KEY
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - TUNNEL_URL (optional, defaults to http://localhost:2022)

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the service:
   \`\`\`bash
   npm start
   \`\`\`

## Tools

### Create Document
Creates a new Google Doc with specified title and optional content.

### Get Document
Retrieves a Google Doc by its ID.

### Update Document
Appends content to an existing Google Doc.

## Authentication

The service uses OAuth2 for authentication with Google. Users need to authenticate before using any of the tools.

## Error Handling

All tools include comprehensive error handling and user-friendly error messages using AlertUIBuilder.
