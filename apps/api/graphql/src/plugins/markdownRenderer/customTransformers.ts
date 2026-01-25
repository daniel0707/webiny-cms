/**
 * Custom markdown transformers for server-side Lexical → Markdown conversion
 * 
 * These transformers handle custom nodes (Admonition, CharacterChat, GitHub Card)
 * as well as Webiny-specific nodes (LinkNode, ImageNode, HeadingNode, QuoteNode).
 * 
 * Export-only: We only need to convert Lexical → Markdown on the server.
 * Import (Markdown → Lexical) is handled client-side in the admin.
 */

import { ElementTransformer, TextMatchTransformer, Transformer } from "@lexical/markdown";
import { 
    $isLinkNode, 
    LinkNode, 
    $isImageNode, 
    ImageNode,
    $isListNode as $isWebinyListNode,
    ListNode as WebinyListNode,
    $isListItemNode as $isWebinyListItemNode,
    ListItemNode as WebinyListItemNode
} from "@webiny/lexical-nodes";
import { 
    $isTableNode, 
    TableNode,
    $isTableRowNode,
    TableRowNode,
    $isTableCellNode,
    TableCellNode
} from "@lexical/table";
import { TableCellHeaderStates } from "@lexical/table";
import { TextNode, $isTextNode, $getRoot } from "lexical";

import { $isAdmonitionNode, AdmonitionNode } from "./nodes/AdmonitionNode";
import { $isCharacterChatNode, CharacterChatNode } from "./nodes/CharacterChatNode";
import { $isGitHubCardNode, GitHubCardNode } from "./nodes/GitHubCardNode";
import { $isHorizontalRuleNode, HorizontalRuleNode } from "./nodes/HorizontalRuleNode";
import { emojiToName } from "./emojiData";

/**
 * Custom LIST transformer for Webiny's ListNode
 * Webiny uses a custom ListNode with type "webiny-list"
 * Supports bullet, number, and check list types
 */
export const WEBINY_LIST: ElementTransformer = {
    dependencies: [WebinyListNode, WebinyListItemNode],
    export: (node, exportChildren) => {
        if (!$isWebinyListNode(node)) {
            return null;
        }
        return exportListItems(node, exportChildren, 0);
    },
    regExp: /NEVER_MATCH/,
    replace: () => {},
    type: 'element'
};

/**
 * Helper function to recursively export list items with proper indentation
 */
function exportListItems(
    listNode: WebinyListNode, 
    exportChildren: (node: any) => string,
    depth: number
): string {
    const output: string[] = [];
    const listType = listNode.getListType();
    const children = listNode.getChildren();
    let itemNumber = listNode.getStart ? listNode.getStart() : 1;

    for (const child of children) {
        if (!$isWebinyListItemNode(child)) {
            continue;
        }

        const indent = '    '.repeat(depth);
        let prefix: string;
        
        if (listType === 'number') {
            prefix = `${itemNumber}. `;
            itemNumber++;
        } else if (listType === 'check') {
            const checked = child.getChecked();
            prefix = checked ? '- [x] ' : '- [ ] ';
        } else {
            // bullet
            prefix = '- ';
        }

        // Get children of the list item
        const itemChildren = child.getChildren();
        const textParts: string[] = [];
        let hasNestedList = false;
        
        for (const itemChild of itemChildren) {
            if ($isWebinyListNode(itemChild)) {
                // Nested list - recurse
                hasNestedList = true;
                const nestedOutput = exportListItems(itemChild, exportChildren, depth + 1);
                if (textParts.length > 0) {
                    output.push(indent + prefix + textParts.join(''));
                    textParts.length = 0;
                }
                output.push(nestedOutput);
            } else {
                // Regular content - get text content directly
                textParts.push(itemChild.getTextContent());
            }
        }

        if (textParts.length > 0) {
            output.push(indent + prefix + textParts.join(''));
        } else if (!hasNestedList) {
            // Empty list item
            output.push(indent + prefix);
        }
    }

    return output.join('\n');
}

/**
 * Custom LINK transformer for Webiny's LinkNode
 */
export const WEBINY_LINK: TextMatchTransformer = {
    dependencies: [LinkNode],
    export: (node, exportChildren, exportFormat) => {
        if (!$isLinkNode(node)) {
            return null;
        }
        
        const url = node.getURL();
        const title = node.getTitle();
        const textContent = node.getTextContent();
        
        // Format: [text](url "title") or [text](url)
        const linkContent = title 
            ? `[${textContent}](${url} "${title}")` 
            : `[${textContent}](${url})`;
        
        const firstChild = node.getFirstChild();
        
        // Add text styles only if link has single text node inside
        if (node.getChildrenSize() === 1 && $isTextNode(firstChild)) {
            return exportFormat(firstChild, linkContent);
        } else {
            return linkContent;
        }
    },
    // Import not needed on server
    importRegExp: /NEVER_MATCH/,
    regExp: /NEVER_MATCH/,
    replace: () => {},
    trigger: ')',
    type: 'text-match'
};

/**
 * Custom IMAGE transformer for Webiny's ImageNode
 */
export const WEBINY_IMAGE: TextMatchTransformer = {
    dependencies: [ImageNode],
    export: (node) => {
        if (!$isImageNode(node)) {
            return null;
        }
        
        const src = node.getSrc();
        const alt = node.getAltText();
        
        // Try to extract caption from nested editor
        let captionText = "";
        try {
            const captionEditor = (node as any).__caption;
            if (captionEditor && (node as any).__showCaption) {
                captionEditor.getEditorState().read(() => {
                    const root = $getRoot();
                    captionText = root.getTextContent();
                });
            }
        } catch (e) {
            // Continue without caption
        }
        
        if (captionText) {
            return `![${alt || ""}](${src} "${captionText}")`;
        } else {
            return `![${alt || ""}](${src})`;
        }
    },
    type: 'text-match',
    importRegExp: /NEVER_MATCH/,
    regExp: /NEVER_MATCH/,
    replace: () => {},
    trigger: ')'
};

/**
 * HORIZONTAL_RULE transformer
 */
export const HORIZONTAL_RULE: ElementTransformer = {
    dependencies: [HorizontalRuleNode],
    export: (node) => {
        if (!$isHorizontalRuleNode(node)) {
            return null;
        }
        return '---';
    },
    regExp: /NEVER_MATCH/,
    replace: () => {},
    type: 'element'
};

/**
 * TABLE transformer for GitHub Flavored Markdown tables
 */
export const TABLE: ElementTransformer = {
    dependencies: [TableNode, TableRowNode, TableCellNode],
    export: (node) => {
        if (!$isTableNode(node)) {
            return null;
        }

        const output: string[] = [];
        const rows = node.getChildren();

        rows.forEach((row) => {
            if (!$isTableRowNode(row)) {
                return;
            }

            const rowOutput: string[] = [];
            let isHeaderRow = false;

            const cells = row.getChildren();
            cells.forEach((cell) => {
                if (!$isTableCellNode(cell)) {
                    return;
                }
                
                let text = cell.getTextContent().replace(/\n/g, '\\n').trim();
                if (text === '\u200B') {
                    text = '';
                }
                rowOutput.push(text);
                
                if (cell.getHeaderStyles() === TableCellHeaderStates.ROW) {
                    isHeaderRow = true;
                }
            });

            output.push(`| ${rowOutput.join(' | ')} |`);
            
            if (isHeaderRow) {
                output.push(`| ${rowOutput.map(() => '---').join(' | ')} |`);
            }
        });

        return output.join('\n');
    },
    regExp: /NEVER_MATCH/,
    replace: () => {},
    type: 'element'
};

/**
 * GITHUB_CARD transformer
 * Uses remark directive syntax - leaf directive (two colons, no closing)
 */
export const GITHUB_CARD: ElementTransformer = {
    dependencies: [GitHubCardNode],
    export: (node) => {
        if (!$isGitHubCardNode(node)) {
            return null;
        }

        const repoPath = node.getRepoPath();
        return `::github{repo="${repoPath}"}`;
    },
    regExp: /NEVER_MATCH/,
    replace: () => {},
    type: 'element'
};

/**
 * CHARACTER_CHAT transformer
 */
export const CHARACTER_CHAT: ElementTransformer = {
    dependencies: [CharacterChatNode],
    export: (node, exportChildren) => {
        if (!$isCharacterChatNode(node)) {
            return null;
        }

        const characterName = node.getCharacterName();
        const imageUrl = node.getImageUrl();
        const align = node.getAlign();
        const content = exportChildren(node);
        
        const alignAttr = align ? `{align="${align}"}` : '';
        return `:::${characterName}[${imageUrl}]${alignAttr}\n${content}\n:::`;
    },
    regExp: /NEVER_MATCH/,
    replace: () => {},
    type: 'element'
};

/**
 * ADMONITION transformer
 */
export const ADMONITION: ElementTransformer = {
    dependencies: [AdmonitionNode],
    export: (node, exportChildren) => {
        if (!$isAdmonitionNode(node)) {
            return null;
        }

        const type = node.getAdmonitionType();
        const content = exportChildren(node);
        
        return `:::${type}\n${content}\n:::`;
    },
    regExp: /NEVER_MATCH/,
    replace: () => {},
    type: 'element'
};

/**
 * EMOJI transformer - export only
 * This handles inline emoji conversion to shortcodes
 */
export const EMOJI: TextMatchTransformer = {
    dependencies: [TextNode],
    export: () => null,  // Export handled separately via post-processing
    importRegExp: /NEVER_MATCH/,
    regExp: /NEVER_MATCH/,
    replace: () => {},
    trigger: ':',
    type: 'text-match'
};

/**
 * Converts emojis in a string to their shortcode equivalents (e.g., 😄 → :smile:)
 * Uses Intl.Segmenter for proper emoji grapheme cluster handling
 */
export function convertEmojisToShortcodes(text: string): string {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = segmenter.segment(text);
    const result: string[] = [];
    
    for (const segment of segments) {
        const char = segment.segment;
        const shortcode = emojiToName[char];
        if (shortcode) {
            result.push(`:${shortcode}:`);
        } else {
            result.push(char);
        }
    }
    
    return result.join('');
}

/**
 * All custom transformers for markdown export
 * Combined with Lexical's default TRANSFORMERS in the renderer
 */
export const CUSTOM_TRANSFORMERS: Transformer[] = [
    // Webiny node replacements
    WEBINY_LIST,
    WEBINY_LINK,
    WEBINY_IMAGE,
    // Custom elements
    HORIZONTAL_RULE,
    TABLE,
    GITHUB_CARD,
    CHARACTER_CHAT,
    ADMONITION,
];
