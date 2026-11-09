// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "./src"),
        },
    },
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(import.meta.dirname, "lib/mom.js"),
            name: "mom",
            fileName: "mom",
        },
    },
    test: {
        exclude: ["dist/**", "lib/**", "node_modules/**", "misc/**"],
    },
});
