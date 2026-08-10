import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-5.6-luna",
  // duckdb is a native addon — Eve must not bundle it into authored tools.
  build: {
    externalDependencies: ["duckdb"],
  },
});
