import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import ui from '@nuxt/ui/vite';

export default defineConfig({
  plugins: [
    vue(),
    ui({
      colorMode: false,
      ui: {
        colors: {
          primary: 'red',
          neutral: 'slate',
        },
      },
    }),
  ],
});
