# Safe Mind MCP server (stdio). Used by directory health checks (e.g. Glama)
# to start the server and run MCP introspection.
FROM node:22-alpine
WORKDIR /app
COPY mcp/package.json mcp/tsconfig.json mcp/tsconfig.esm.json ./
COPY mcp/src ./src
RUN npm install && npx tsc --project tsconfig.esm.json && npm prune --omit=dev
ENTRYPOINT ["node", "lib/index.js"]
