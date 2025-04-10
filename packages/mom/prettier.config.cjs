/** @type {import("prettier").Config} */
module.exports = {
    tabWidth: 2,
    printWidth: 120,
    overrides: [
        {
            files: "*.md",
            options: {
                tabWidth: 2,
            },
        },
    ],
};
