/**
 * MarkdownRenderer - Server-side Lexical JSON to Markdown converter
 * 
 * Uses @lexical/headless to create a headless editor, parse the stored
 * editor state, and convert it to markdown using $convertToMarkdownString.
 * 
 * Based on Webiny's LexicalRenderer pattern (for HTML) but outputs markdown.
 * 
 * NOTE: DOM globals (window, document) must be set up BEFORE importing this module.
 * This is handled by ensureDOMGlobals() in index.ts
 */

import { createHeadlessEditor } from "@lexical/headless";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { allNodes } from "@webiny/lexical-nodes";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { CodeNode, CodeHighlightNode } from "@lexical/code";

// Custom nodes for our blog
import { AdmonitionNode } from "./nodes/AdmonitionNode";
import { CharacterChatNode } from "./nodes/CharacterChatNode";
import { GitHubCardNode } from "./nodes/GitHubCardNode";
import { HorizontalRuleNode } from "./nodes/HorizontalRuleNode";

// Custom transformers for markdown export
import { CUSTOM_TRANSFORMERS, convertEmojisToShortcodes } from "./customTransformers";

/**
 * MarkdownRenderer class
 * Converts Lexical JSON state to Markdown string
 */
export class MarkdownRenderer {
    private editor: ReturnType<typeof createHeadlessEditor>;

    constructor() {
        // Create headless editor with all required nodes
        // Note: Type casting to any to handle Lexical version differences between
        // @webiny/lexical-nodes and @lexical/headless. At runtime, the nodes are compatible.
        this.editor = createHeadlessEditor({
            nodes: [
                // Webiny's built-in nodes
                ...(allNodes as any[]),
                // Additional Lexical nodes
                HorizontalRuleNode,
                TableNode,
                TableRowNode,
                TableCellNode,
                CodeNode,
                CodeHighlightNode,
                // Our custom nodes
                AdmonitionNode,
                CharacterChatNode,
                GitHubCardNode,
            ] as any[],
            onError: (error: any) => {
                console.error('[MarkdownRenderer] Editor error:', {
                    message: error?.message || 'Unknown error',
                    stack: error?.stack || 'No stack trace',
                });
            },
        });
    }

    /**
     * Render Lexical JSON state to Markdown string
     */
    render(contents: any): string | undefined {
        if (!contents || typeof contents !== 'object' || !('root' in contents)) {
            console.warn('[MarkdownRenderer] Invalid contents format, expected Lexical state');
            return undefined;
        }

        try {
            // Parse and set the editor state
            const editorState = this.editor.parseEditorState(JSON.stringify(contents));
            this.editor.setEditorState(editorState);

            let markdown = "";

            // Convert to markdown within editor context
            this.editor.update(() => {
                // Combine our custom transformers with Lexical's defaults
                // Custom transformers first so they take priority
                const transformers = [...CUSTOM_TRANSFORMERS, ...TRANSFORMERS];
                
                markdown = $convertToMarkdownString(transformers);
            }, { discrete: true });

            // Post-process: convert emojis to shortcodes
            markdown = convertEmojisToShortcodes(markdown);

            return markdown;
        } catch (error: any) {
            console.error('[MarkdownRenderer] Failed to render markdown:', {
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace',
                name: error?.name || 'Unknown',
            });
            return undefined;
        }
    }
}
