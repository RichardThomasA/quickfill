import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // entrypoints for extension UI pages if needed
        options: 'src/extension/options/options.html',
        popup: 'src/extension/popup/popup.html'
      }
    }
  }
});
