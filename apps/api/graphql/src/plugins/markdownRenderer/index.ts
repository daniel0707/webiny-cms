/**
 * createMarkdownRenderer - Webiny plugin for Lexical → Markdown conversion
 * 
 * Registers a "markdown" format for rich text fields in GraphQL.
 * Usage: content(format: "markdown")
 * 
 * Based on Webiny's createLexicalHTMLRenderer pattern.
 */

import { CmsRichTextRendererPlugin } from "@webiny/api-headless-cms/plugins";

/**
 * Type guard to check if contents are Lexical format
 */
function isLexicalContents(contents: any): contents is { root: any } {
    return contents && typeof contents === 'object' && 'root' in contents;
}

/**
 * Creates a CmsRichTextRendererPlugin for markdown format
 * 
 * Uses dynamic import to lazy-load the renderer (like Webiny's HTML renderer)
 * This helps reduce cold start time for Lambda functions.
 */
export function createMarkdownRenderer(): CmsRichTextRendererPlugin<string> {
    return new CmsRichTextRendererPlugin<string>(
        "markdown",
        async (contents, next) => {
            // Only handle Lexical content (has root property)
            if (!isLexicalContents(contents)) {
                return next(contents);
            }

            try {
                // Dynamic import for code splitting
                const { MarkdownRenderer } = await import("./MarkdownRenderer");
                const renderer = new MarkdownRenderer();
                const result = renderer.render(contents);
                
                if (result === undefined) {
                    // Rendering failed, pass to next renderer
                    return next(contents);
                }
                
                return result;
            } catch (error: any) {
                // Log detailed error info since Error objects don't serialize well
                console.error('[createMarkdownRenderer] Error rendering markdown:', {
                    message: error?.message || 'Unknown error',
                    stack: error?.stack || 'No stack trace',
                    name: error?.name || 'Unknown',
                });
                return next(contents);
            }
        }
    );
}
