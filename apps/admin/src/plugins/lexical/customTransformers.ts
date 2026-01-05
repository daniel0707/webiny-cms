import { TextMatchTransformer, ElementTransformer } from "@lexical/markdown";
import { $createTextNode, $isTextNode, $createParagraphNode, $isParagraphNode, $getRoot, TextNode, LexicalNode } from "lexical";
import { 
    $createLinkNode, $isLinkNode, LinkNode, 
    $createImageNode, $isImageNode, ImageNode,
    $isListNode as $isWebinyListNode, ListNode as WebinyListNode, $createListNode as $createWebinyListNode,
    $isListItemNode as $isWebinyListItemNode, ListItemNode as WebinyListItemNode, $createListItemNode as $createWebinyListItemNode
} from "@webiny/lexical-nodes";
import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { 
    $isTableNode, 
    TableNode,
    $isTableRowNode,
    TableRowNode,
    $isTableCellNode,
    TableCellNode,
    $createTableNode,
    $createTableRowNode,
    $createTableCellNode
} from "@lexical/table";
import { TableCellHeaderStates } from "@lexical/table";
import { $createAdmonitionNode, $isAdmonitionNode, AdmonitionNode, AdmonitionType } from "./nodes/AdmonitionNode";
import { $createCharacterChatNode, $isCharacterChatNode, CharacterChatNode } from "./nodes/CharacterChatNode";
import { $createGitHubCardNode, $isGitHubCardNode, GitHubCardNode } from "./nodes/GitHubCardNode";
import { nameToEmoji } from "./emojiData";

/**
 * Custom LINK transformer that works with Webiny's LinkNode
 * Based on @lexical/markdown's LINK transformer but adapted for @webiny/lexical-nodes
 * 
 * Supports:
 * - Simple links: [text](url)
 * - Links with titles: [text](url "title")
 * - Preserves text formatting when link has single text node
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
        // Markdown doesn't support nested styles for links with multiple children
        if (node.getChildrenSize() === 1 && $isTextNode(firstChild)) {
            return exportFormat(firstChild, linkContent);
        } else {
            return linkContent;
        }
    },
    // Matches: [text](url) or [text](url "title")
    importRegExp: /(?:\[([^[]+)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))/,
    regExp: /(?:\[([^[]+)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)\))$/,
    replace: (textNode, match) => {
        const [, linkText, linkUrl, linkTitle] = match;
        
        console.log('[WEBINY_LINK] Match found:', { linkText, linkUrl, linkTitle });
        console.log('[WEBINY_LINK] Full match:', match[0]);
        
        // Create Webiny's LinkNode with URL and optional title
        const linkNode = $createLinkNode(linkUrl, {
            title: linkTitle || null
        });
        
        // Create text node with the link text
        const linkTextNode = $createTextNode(linkText);
        linkTextNode.setFormat(textNode.getFormat());
        
        // Add text node as child of link node
        linkNode.append(linkTextNode);
        
        // Replace the text node with link node
        textNode.replace(linkNode);
    },
    trigger: ')',
    type: 'text-match'
};

/**
 * Custom IMAGE transformer that works with Webiny's ImageNode
 * 
 * This is a special transformer that handles DecoratorNodes (ImageNode)
 * Format: ![alt](url "caption") - caption is optional and stored in title attribute
 */
export const WEBINY_IMAGE: TextMatchTransformer = {
    dependencies: [ImageNode],
    export: (node) => {
        if (!$isImageNode(node)) {
            return null;
        }
        
        const src = node.getSrc();
        const alt = node.getAltText();
        
        // Extract caption text from the nested caption editor
        let captionText = "";
        try {
            // Access the internal caption editor and get its text content
            const captionEditor = (node as any).__caption;
            if (captionEditor && (node as any).__showCaption) {
                captionEditor.getEditorState().read(() => {
                    const root = $getRoot();
                    captionText = root.getTextContent();
                });
            }
        } catch (e) {
            // If caption extraction fails, continue without it
            console.warn("Failed to extract image caption:", e);
        }
        
        // Markdown image format with caption as title: ![alt](url "caption")
        // Or without caption: ![alt](url)
        if (captionText) {
            return `![${alt || ""}](${src} "${captionText}")`;
        } else {
            return `![${alt || ""}](${src})`;
        }
    },
    type: 'text-match',
    // Matches: ![alt](url "caption") or ![alt](url)
    importRegExp: /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/,
    regExp: /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/,
    replace: (textNode, match) => {
        const [, altText, src, caption] = match;
        
        // Create image node with caption support
        const imageNode = $createImageNode({
            id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            src: src,
            altText: altText || "",
            maxWidth: 800,
            showCaption: !!caption // Show caption if caption text exists
        });
        
        // If there's a caption, populate the caption editor
        if (caption) {
            try {
                const captionEditor = (imageNode as any).__caption;
                if (captionEditor) {
                    captionEditor.update(() => {
                        const root = $getRoot();
                        root.clear();
                        const paragraph = $createParagraphNode();
                        paragraph.append($createTextNode(caption));
                        root.append(paragraph);
                    });
                }
            } catch (e) {
                console.warn("Failed to set image caption:", e);
            }
        }
        
        // Create a paragraph to wrap the image
        const paragraph = $createParagraphNode();
        paragraph.append(imageNode);
        
        // Replace the text node's parent with the paragraph
        const parent = textNode.getParent();
        if (parent) {
            parent.replace(paragraph);
        }
    },
    trigger: ')'
};

/**
 * Custom HORIZONTAL_RULE transformer for markdown horizontal rules
 * 
 * Supports markdown formats: ---, ***, ___
 * All three formats are converted to --- on export
 */
export const HORIZONTAL_RULE: ElementTransformer = {
    dependencies: [HorizontalRuleNode],
    export: (node) => {
        if (!$isHorizontalRuleNode(node)) {
            return null;
        }
        return '---';
    },
    regExp: /^(---|\*\*\*|___)\s?$/,
    replace: (parentNode) => {
        const hrNode = $createHorizontalRuleNode();
        parentNode.replace(hrNode);
    },
    type: 'element'
};

// Table transformers based on Lexical Playground implementation
const TABLE_ROW_REG_EXP = /^(?:\|)(.*?)(?:\|)\s?$/;
const TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-+:? ?)+\|\s?$/;

/**
 * Custom TABLE transformer for markdown tables (Lexical Playground approach)
 * 
 * Supports GitHub Flavored Markdown table syntax:
 * | Header 1 | Header 2 |
 * | -------- | -------- |
 * | Cell 1   | Cell 2   |
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
                
                // Get text content from cell, replace newlines with \n
                let text = cell.getTextContent().replace(/\n/g, '\\n').trim();
                // Remove zero-width space if it's the only content (empty cell marker)
                if (text === '\u200B') {
                    text = '';
                }
                rowOutput.push(text);
                
                if (cell.getHeaderStyles() === TableCellHeaderStates.ROW) {
                    isHeaderRow = true;
                }
            });

            output.push(`| ${rowOutput.join(' | ')} |`);
            
            // Add separator row after header row
            if (isHeaderRow) {
                output.push(`| ${rowOutput.map(() => '---').join(' | ')} |`);
            }
        });

        return output.join('\n');
    },
    regExp: TABLE_ROW_REG_EXP,
    replace: (parentNode, _1, match) => {
        // Header row divider detection
        if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
            const table = parentNode.getPreviousSibling();
            if (!table || !$isTableNode(table)) {
                return;
            }

            const rows = table.getChildren();
            const lastRow = rows[rows.length - 1];
            if (!lastRow || !$isTableRowNode(lastRow)) {
                return;
            }

            // Add header state to row cells
            lastRow.getChildren().forEach((cell) => {
                if (!$isTableCellNode(cell)) {
                    return;
                }
                cell.setHeaderStyles(
                    TableCellHeaderStates.ROW,
                    TableCellHeaderStates.ROW
                );
            });

            // Remove divider line
            parentNode.remove();
            return;
        }

        const matchCells = mapToTableCells(match[0]);
        if (matchCells == null) {
            return;
        }

        const rows = [matchCells];
        let sibling = parentNode.getPreviousSibling();
        let maxCells = matchCells.length;

        // Collect previous rows that are part of the table
        while (sibling) {
            if (!$isParagraphNode(sibling)) {
                break;
            }

            if (sibling.getChildrenSize() !== 1) {
                break;
            }

            const firstChild = sibling.getFirstChild<TextNode>();
            if (!$isTextNode(firstChild)) {
                break;
            }

            const cells = mapToTableCells(firstChild.getTextContent());
            if (cells == null) {
                break;
            }

            maxCells = Math.max(maxCells, cells.length);
            rows.unshift(cells);
            const previousSibling = sibling.getPreviousSibling();
            sibling.remove();
            sibling = previousSibling;
        }
        const table = $createTableNode();

        for (const cells of rows) {
            const tableRow = $createTableRowNode();
            table.append(tableRow);

            for (let i = 0; i < maxCells; i++) {
                tableRow.append(i < cells.length ? cells[i] : createTableCell(''));
            }
        }

        const previousSibling = parentNode.getPreviousSibling();
        if (
            $isTableNode(previousSibling) &&
            getTableColumnsSize(previousSibling) === maxCells
        ) {
            previousSibling.append(...table.getChildren());
            parentNode.remove();
        } else {
            parentNode.replace(table);
        }

        // Don't call selectEnd() - it can cause selection errors with tables
        // table.selectEnd();
    },
    type: 'element'
};

function getTableColumnsSize(table: TableNode): number {
    const row = table.getFirstChild();
    if (!$isTableRowNode(row)) {
        return 0;
    }
    return row.getChildrenSize();
}

function createTableCell(textContent: string): TableCellNode {
    const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
    const paragraph = $createParagraphNode();
    // Ensure cell has at least one character (space) to prevent Lexical from removing empty cells
    const content = textContent.replace(/\\n/g, '\n') || '\u200B'; // Zero-width space if empty
    const text = $createTextNode(content);
    paragraph.append(text);
    cell.append(paragraph);
    return cell;
}

function mapToTableCells(textContent: string): Array<TableCellNode> | null {
    const match = textContent.match(TABLE_ROW_REG_EXP);
    if (!match || !match[0]) {
        return null;
    }
    // Split the entire matched string by | and filter out the first and last (empty strings from leading/trailing |)
    const parts = match[0].split('|');
    // Remove first and last empty parts (from | at start and end)
    const cellTexts = parts.slice(1, -1);
    
    return cellTexts.map((text) => createTableCell(text.trim()));
}

/**
 * GITHUB_CARD transformer for single-line GitHub repository cards
 * 
 * Format: ::github{repo="user/repo"}
 * 
 * Unlike admonitions and character chats, this is a single line with no closing ::
 * The regex matches the full pattern and creates a GitHubCardNode
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
    regExp: /^::github\{repo="([^"]+)"\}\s*$/,
    replace: (parentNode, _1, match) => {
        const repoPath = match[1];
        
        // Validate repo path format (should be user/repo or org/repo)
        if (!repoPath || !repoPath.includes('/')) {
            console.warn('[GITHUB_CARD] Invalid repo path format:', repoPath);
            return;
        }
        
        const githubCard = $createGitHubCardNode(repoPath);
        parentNode.replace(githubCard);
    },
    type: 'element'
};

/**
 * CHARACTER_CHAT transformer for markdown directive syntax with images
 * 
 * Format:
 * :::characterName[imageURL]{align="right"}
 * content
 * :::
 * 
 * Note: Import is handled by ADMONITION transformer (checks for :::name[url] pattern)
 * This transformer only handles export (Rich Text → Markdown)
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
    regExp: /^NEVER_MATCH_HANDLED_BY_ADMONITION$/,
    replace: () => {
        // Character chat import (Markdown → Rich Text) is handled by ADMONITION transformer
        // This transformer only handles export (Rich Text → Markdown)
    },
    type: 'element'
};

/**
 * ADMONITION transformer for markdown directive syntax
 * 
 * Supports: :::note, :::tip, :::important, :::caution, :::warning
 * Format:
 * :::type
 * content
 * :::
 * 
 * Note: Works like TABLE transformer - closing ::: triggers collection of previous content
 * Must be placed AFTER CHARACTER_CHAT transformer
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
    regExp: /^:::(\s|$)/,
    replace: (parentNode) => {
        // This is a closing ::: - look backward for opening :::type or :::(name)[url]
        let sibling = parentNode.getPreviousSibling();
        const contentNodes: LexicalNode[] = [];
        let admonitionType: AdmonitionType | null = null;
        let characterChatData: { name: string; url: string; align?: 'left' | 'right' } | null = null;
        let openingNode: LexicalNode | null = null;
        let beforeContent: string | null = null;
        
        while (sibling) {
            const textContent = sibling.getTextContent();
            
            if ($isParagraphNode(sibling)) {
                // First check for character chat: :::name[url]{align="..."}
                const characterChatMatch = textContent.match(/^([\s\S]*?):::([a-zA-Z0-9._-]+)\[([^\]]+)\](?:\{align="(left|right)"\})?(?:\n([\s\S]*))?$/);
                if (characterChatMatch) {
                    const contentBefore = characterChatMatch[1];
                    const characterName = characterChatMatch[2];
                    const imageUrl = characterChatMatch[3];
                    const align = characterChatMatch[4] as 'left' | 'right' | undefined;
                    const inlineContent = characterChatMatch[5];
                    
                    characterChatData = { name: characterName, url: imageUrl, align };
                    openingNode = sibling;
                    
                    if (contentBefore && contentBefore.trim()) {
                        beforeContent = contentBefore.replace(/\n$/, '');
                    }
                    
                    if (inlineContent && inlineContent.trim()) {
                        const contentParagraph = $createParagraphNode();
                        contentParagraph.append($createTextNode(inlineContent));
                        contentNodes.unshift(contentParagraph);
                    }
                    
                    break;
                }
                
                // Then check for admonition: :::type
                const admonitionMatch = textContent.match(/^([\s\S]*?):::([a-z]+)(?:\n([\s\S]*))?$/);
                if (admonitionMatch) {
                    const contentBefore = admonitionMatch[1];
                    const foundType = admonitionMatch[2] as AdmonitionType;
                    const inlineContent = admonitionMatch[3];
                    const validTypes: AdmonitionType[] = ['note', 'tip', 'important', 'caution', 'warning'];
                    
                    if (validTypes.includes(foundType)) {
                        admonitionType = foundType;
                        openingNode = sibling;
                        
                        if (contentBefore && contentBefore.trim()) {
                            beforeContent = contentBefore.replace(/\n$/, '');
                        }
                        
                        if (inlineContent && inlineContent.trim()) {
                            const contentParagraph = $createParagraphNode();
                            contentParagraph.append($createTextNode(inlineContent));
                            contentNodes.unshift(contentParagraph);
                        }
                        
                        break;
                    }
                }
            }
            
            // Collect content nodes (going backward, so unshift)
            const prevSibling = sibling.getPreviousSibling();
            contentNodes.unshift(sibling);
            sibling = prevSibling;
        }
        
        if (characterChatData && openingNode) {
            // Create character chat
            const characterChat = $createCharacterChatNode(
                characterChatData.name,
                characterChatData.url,
                characterChatData.align
            );
            
            contentNodes.forEach(node => {
                characterChat.append(node);
            });
            
            if (contentNodes.length === 0) {
                characterChat.append($createParagraphNode());
            }
            
            if (beforeContent) {
                const beforeParagraph = $createParagraphNode();
                beforeParagraph.append($createTextNode(beforeContent));
                openingNode.replace(beforeParagraph);
                beforeParagraph.insertAfter(characterChat);
            } else {
                openingNode.replace(characterChat);
            }
            
            parentNode.remove();
        } else if (admonitionType && openingNode) {
            // Create admonition
            const admonition = $createAdmonitionNode(admonitionType);
            
            contentNodes.forEach(node => {
                admonition.append(node);
            });
            
            if (contentNodes.length === 0) {
                admonition.append($createParagraphNode());
            }
            
            if (beforeContent) {
                const beforeParagraph = $createParagraphNode();
                beforeParagraph.append($createTextNode(beforeContent));
                openingNode.replace(beforeParagraph);
                beforeParagraph.insertAfter(admonition);
            } else {
                openingNode.replace(admonition);
            }
            
            parentNode.remove();
        } else {
            // No valid opening found, remove closing :::
            parentNode.remove();
        }
    },
    type: 'element'
};

/**
 * Custom LIST transformers for Webiny's ListNode
 * Webiny uses a custom ListNode with type "webiny-list"
 * 
 * These replace Lexical's built-in ORDERED_LIST and UNORDERED_LIST
 */

// Helper function to export list items recursively
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
 * WEBINY_UNORDERED_LIST transformer for bullet lists
 */
export const WEBINY_UNORDERED_LIST: ElementTransformer = {
    dependencies: [WebinyListNode, WebinyListItemNode],
    export: (node, exportChildren) => {
        if (!$isWebinyListNode(node)) {
            return null;
        }
        if (node.getListType() !== 'bullet') {
            return null;
        }
        return exportListItems(node, exportChildren, 0);
    },
    regExp: /^(\s*)[-*+]\s/,
    replace: (parentNode, _1, match) => {
        const indent = match[1]?.length ?? 0;
        const indentLevel = Math.floor(indent / 4);
        
        // Create list item with text content
        const textContent = parentNode.getTextContent().replace(/^(\s*)[-*+]\s/, '');
        const listItem = $createWebinyListItemNode();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(textContent));
        listItem.append(paragraph);
        
        // Check if previous sibling is a bullet list we can append to
        const prevSibling = parentNode.getPreviousSibling();
        if ($isWebinyListNode(prevSibling) && prevSibling.getListType() === 'bullet') {
            // Handle indentation
            if (indentLevel > 0) {
                // Find the last list item to nest under
                const lastItem = prevSibling.getLastChild();
                if ($isWebinyListItemNode(lastItem)) {
                    // Look for existing nested list or create one
                    let nestedList = lastItem.getChildren().find(c => $isWebinyListNode(c)) as WebinyListNode | undefined;
                    if (!nestedList) {
                        nestedList = $createWebinyListNode('bullet');
                        lastItem.append(nestedList);
                    }
                    nestedList.append(listItem);
                }
            } else {
                prevSibling.append(listItem);
            }
            parentNode.remove();
        } else {
            // Create new list
            const list = $createWebinyListNode('bullet');
            list.append(listItem);
            parentNode.replace(list);
        }
    },
    type: 'element'
};

/**
 * WEBINY_ORDERED_LIST transformer for numbered lists
 */
export const WEBINY_ORDERED_LIST: ElementTransformer = {
    dependencies: [WebinyListNode, WebinyListItemNode],
    export: (node, exportChildren) => {
        if (!$isWebinyListNode(node)) {
            return null;
        }
        if (node.getListType() !== 'number') {
            return null;
        }
        return exportListItems(node, exportChildren, 0);
    },
    regExp: /^(\s*)(\d+)\.\s/,
    replace: (parentNode, _1, match) => {
        const indent = match[1]?.length ?? 0;
        const indentLevel = Math.floor(indent / 4);
        const itemNumber = parseInt(match[2], 10); // Extract the number from markdown
        
        // Create list item with text content
        const textContent = parentNode.getTextContent().replace(/^(\s*)(\d+)\.\s/, '');
        const listItem = $createWebinyListItemNode();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(textContent));
        listItem.append(paragraph);
        
        // Check if previous sibling is a numbered list we can append to
        const prevSibling = parentNode.getPreviousSibling();
        if ($isWebinyListNode(prevSibling) && prevSibling.getListType() === 'number') {
            // Handle indentation
            if (indentLevel > 0) {
                // Find the last list item to nest under
                const lastItem = prevSibling.getLastChild();
                if ($isWebinyListItemNode(lastItem)) {
                    // Look for existing nested list or create one
                    let nestedList = lastItem.getChildren().find(c => $isWebinyListNode(c)) as WebinyListNode | undefined;
                    if (!nestedList) {
                        nestedList = $createWebinyListNode('number');
                        lastItem.append(nestedList);
                    }
                    nestedList.append(listItem);
                }
            } else {
                prevSibling.append(listItem);
            }
            parentNode.remove();
        } else {
            // Create new list - set start number from markdown
            const list = $createWebinyListNode('number');
            // Set the start value if available
            if (typeof (list as any).setStart === 'function') {
                (list as any).setStart(itemNumber);
            }
            list.append(listItem);
            parentNode.replace(list);
        }
    },
    type: 'element'
};

/**
 * WEBINY_CHECK_LIST transformer for checkbox lists
 */
export const WEBINY_CHECK_LIST: ElementTransformer = {
    dependencies: [WebinyListNode, WebinyListItemNode],
    export: (node, exportChildren) => {
        if (!$isWebinyListNode(node)) {
            return null;
        }
        if (node.getListType() !== 'check') {
            return null;
        }
        return exportListItems(node, exportChildren, 0);
    },
    regExp: /^(\s*)- \[(x| )?\]\s/i,
    replace: (parentNode, _1, match) => {
        const indent = match[1]?.length ?? 0;
        const indentLevel = Math.floor(indent / 4);
        const isChecked = match[2]?.toLowerCase() === 'x';
        
        // Create list item with text content
        const textContent = parentNode.getTextContent().replace(/^(\s*)- \[(x| )?\]\s/i, '');
        const listItem = $createWebinyListItemNode(isChecked);
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(textContent));
        listItem.append(paragraph);
        
        // Check if previous sibling is a check list we can append to
        const prevSibling = parentNode.getPreviousSibling();
        if ($isWebinyListNode(prevSibling) && prevSibling.getListType() === 'check') {
            // Handle indentation
            if (indentLevel > 0) {
                // Find the last list item to nest under
                const lastItem = prevSibling.getLastChild();
                if ($isWebinyListItemNode(lastItem)) {
                    // Look for existing nested list or create one
                    let nestedList = lastItem.getChildren().find(c => $isWebinyListNode(c)) as WebinyListNode | undefined;
                    if (!nestedList) {
                        nestedList = $createWebinyListNode('check');
                        lastItem.append(nestedList);
                    }
                    nestedList.append(listItem);
                }
            } else {
                prevSibling.append(listItem);
            }
            parentNode.remove();
        } else {
            // Create new list
            const list = $createWebinyListNode('check');
            list.append(listItem);
            parentNode.replace(list);
        }
    },
    type: 'element'
};

/**
 * EMOJI transformer for markdown import
 * 
 * On Import (markdown → rich text):
 *   :smile: → 😄 (converts shortcode to emoji if known, otherwise leaves as-is)
 * 
 * Note: Export (emoji → shortcode) is handled separately in MarkdownToggleAction
 * because TextMatchTransformer.export only handles special node types, not text
 * content transformation within TextNodes.
 */
export const EMOJI: TextMatchTransformer = {
    dependencies: [TextNode],
    export: () => null,  // Export handled in MarkdownToggleAction.convertEmojisToShortcodes
    // Import regex: match :shortcode: pattern
    importRegExp: /:([a-zA-Z0-9_+-]+):/,
    regExp: /:([a-zA-Z0-9_+-]+):/,
    replace: (textNode, match) => {
        const shortcode = match[1];
        const emoji = nameToEmoji[shortcode];
        
        if (emoji) {
            // Replace with emoji
            const emojiNode = $createTextNode(emoji);
            textNode.replace(emojiNode);
        }
        // If no emoji found, leave the original text as-is (do nothing)
    },
    trigger: ':',
    type: 'text-match'
};