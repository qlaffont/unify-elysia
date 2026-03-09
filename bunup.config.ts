import { defineConfig } from 'bunup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    inferTypes: true,
  },
});
