import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 相对资源地址配合哈希导航，可部署在任意 GitHub Pages 项目子目录。
export default defineConfig({ plugins: [react()], base: './' });
