import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
    integrations: [
        starlight({
            title: "mom",
            description: "MobX micro-stores for React — organized the HMVVM way",
            social: {
                github: "https://github.com/asimojs/mom",
            },
            editLink: {
                baseUrl: "https://github.com/asimojs/mom/edit/main/docs/",
            },
            sidebar: [
                {
                    label: "Home",
                    link: "/",
                },
                {
                    label: "Getting Started",
                    link: "/getting-started",
                },
                {
                    label: "Core Concepts",
                    items: [
                        { label: "Why Stores?", link: "/core-concepts/why-stores" },
                        { label: "Store Basics", link: "/core-concepts/store-basics" },
                        { label: "Lifecycle", link: "/core-concepts/lifecycle" },
                        { label: "The HMVVM Pattern", link: "/core-concepts/hmvvm" },
                        { label: "Child Stores", link: "/core-concepts/child-stores" },
                        { label: "Reactivity", link: "/core-concepts/reactivity" },
                        { label: "Dependency Inversion", link: "/core-concepts/dependency-inversion" },
                        { label: "Testing", link: "/core-concepts/testing" },
                    ],
                },
                {
                    label: "Guides",
                    items: [
                        { label: "Building Forms", link: "/guides/forms" },
                        { label: "Built-in Services", link: "/guides/services" },
                        { label: "Progressive Loading", link: "/guides/progressive-loading" },
                        { label: "Existing Projects", link: "/guides/existing-projects" },
                        { label: "Naming Conventions", link: "/guides/conventions" },
                    ],
                },
                {
                    label: "Examples",
                    items: [
                        { label: "Counter", link: "/examples/counter" },
                        { label: "Counter List", link: "/examples/counter-list" },
                        { label: "Folder", link: "/examples/folder" },
                        { label: "Countdown", link: "/examples/countdown" },
                        { label: "Login Form", link: "/examples/login-form" },
                    ],
                },
                {
                    label: "API Reference",
                    items: [
                        { label: "defineStore", link: "/api-reference/definestore" },
                        { label: "createStore", link: "/api-reference/createstore" },
                        { label: "disposeStore", link: "/api-reference/disposestore" },
                        { label: "StoreContext", link: "/api-reference/store-context" },
                        { label: "Store Metadata", link: "/api-reference/store-metadata" },
                        { label: "Types", link: "/api-reference/types" },
                        { label: "registerRootService", link: "/api-reference/registerrootservice" },
                        { label: "rootContext", link: "/api-reference/rootcontext" },
                    ],
                },
                {
                    label: "Agent Documentation",
                    link: "/agent-docs",
                },
            ],
            defaultLocale: "root",
            locales: {
                root: {
                    label: "English",
                    lang: "en",
                },
            },
            head: [
                {
                    tag: "meta",
                    attrs: {
                        name: "keywords",
                        content: "MobX, React, stores, MVVM, HMVVM, TypeScript, micro-stores, state management, dependency injection",
                    },
                },
            ],
            customCss: ["/src/styles/tokyo-night.css"],
        }),
    ],
    outDir: "./docs-dist",
    site: "https://asimojs.github.io",
    base: "/mom",
});
