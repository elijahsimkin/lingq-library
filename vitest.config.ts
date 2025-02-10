// vite.config.ts
import { defineConfig } from "vitest/config";
import UnpluginTypia from '@ryoppippi/unplugin-typia/vite'


export default defineConfig({
  test: {
    globals: true,
    coverage: {
      reporter: ["text", "json", "html"]
    }
  },
  plugins: [UnpluginTypia()],
});
