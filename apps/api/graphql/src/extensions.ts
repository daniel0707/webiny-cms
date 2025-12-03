// This file is automatically updated via scaffolding utilities.
// Learn more about extensions: https://webiny.link/extensions
import { createMarkdownRenderer } from "./plugins/markdownRenderer";

export const extensions = () => {
    return [
        // Markdown format for rich text fields: content(format: "markdown")
        createMarkdownRenderer(),
    ];
};
