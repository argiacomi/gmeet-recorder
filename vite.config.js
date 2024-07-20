import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: './icons/*', dest: './icons' },
        { src: './html/*.html', dest: './html' },
        { src: './manifest.json', dest: '.' }
      ]
    })
  ],
  build: {
    assetsDir: '.',
    chunkSizeWarningLimit: Infinity,
    rollupOptions: {
      input: {
        popup: 'src/components/Popup.jsx',
        background: 'src/background/background.js',
        content: 'src/content/content.js',
        offscreen: 'src/offscreen/offscreen.js',
        'lib/inject': 'src/script/inject.js'
      },
      output: {
        chunkFileNames: (chunkInfo) => {
          console.log(chunkInfo);
          if (['client', 'logger'].includes(chunkInfo.name)) {
            return 'lib/[name].js';
          }
          return '[name].js';
        },
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'es'
      }
    }
  }
});
