import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.cn/config/
export default defineConfig({
  base: './',
  plugins: [vue()]
})
