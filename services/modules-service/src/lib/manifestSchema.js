export const manifestJsonSchema = {
  type: "object",
  required: ["name", "slug", "version", "type"],
  properties: {
    name: { type: "string" },
    slug: { type: "string", pattern: "^[a-z0-9-]+$" },
    version: { type: "string" },
    type: { type: "string", enum: ["ui", "backend", "full"] },
    entryClient: { type: "string" },    // ex: http://host:4007/packages/slug/v1/client.js
    configSchema: { type: "object" }    // optional JSON schema pentru UI config
  },
  additionalProperties: true
};
