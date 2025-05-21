import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  server: {
    port: process.env.PORT || 3000
  },
  envPrefix: 'VITE_'
});
