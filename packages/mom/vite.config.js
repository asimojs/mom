// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, "lib/index.js"),
            name: "mom",
            fileName: "mom",
        },
        rollupOptions: {},
    },
    test: {
        exclude: ["lib/*", "node_modules/*", "misc/*", "**/node_modules/*"],
    },
});
