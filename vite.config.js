import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), vueDevTools()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr'],
    build: {
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    if (/\.(gltf|glb|hdr)$/.test(assetInfo.name ?? '')) {
                        return 'assets/models/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
            },
        },
    },
});
