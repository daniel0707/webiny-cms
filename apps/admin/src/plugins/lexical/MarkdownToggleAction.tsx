import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertToMarkdownString, $convertFromMarkdownString } from "@lexical/markdown";
import { $getRoot, $createTextNode } from "lexical";
import { $createCodeNode, $isCodeNode } from "@lexical/code";
import { 
    BOLD_ITALIC_STAR,
    BOLD_STAR,
    INLINE_CODE,
    ITALIC_STAR,
    STRIKETHROUGH,
    CODE
} from "@lexical/markdown";
import { 
    WEBINY_HEADING,
    WEBINY_QUOTE,
    WEBINY_LINK, 
    WEBINY_IMAGE, 
    HORIZONTAL_RULE, 
    TABLE, 
    ADMONITION, 
    CHARACTER_CHAT, 
    GITHUB_CARD, 
    EMOJI,
    WEBINY_UNORDERED_LIST,
    WEBINY_ORDERED_LIST,
    WEBINY_CHECK_LIST
} from "./customTransformers";
import { emojiToName } from "./emojiData";

const TRANSFORMERS = [
    BOLD_ITALIC_STAR,
    BOLD_STAR,
    INLINE_CODE,
    ITALIC_STAR,
    STRIKETHROUGH,
    WEBINY_HEADING,  // Use Webiny's HeadingNode for proper theme support
    WEBINY_QUOTE,    // Use Webiny's QuoteNode for proper theme support
    CODE,
    GITHUB_CARD,     // Single-line :::github{user/repo} - must come before ADMONITION
    CHARACTER_CHAT,  // Must come before ADMONITION to match :::[name](url) before :::type, and before WEBINY_IMAGE to match [name](url) in character chat context
    ADMONITION,
    TABLE,
    HORIZONTAL_RULE,
    WEBINY_IMAGE,  // Must come before WEBINY_LINK so ![alt](url) matches before [text](url)
    WEBINY_LINK,
    WEBINY_CHECK_LIST,    // Must come before UNORDERED_LIST (- [ ] pattern)
    WEBINY_UNORDERED_LIST,
    WEBINY_ORDERED_LIST,
    EMOJI          // Emoji shortcode <-> emoji conversion
];

/**
 * Converts emojis in a string to their shortcode equivalents (e.g., 😄 → :smile:)
 * Uses Intl.Segmenter for proper emoji grapheme cluster handling
 */
function convertEmojisToShortcodes(text: string): string {
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
 * Toolbar action button to toggle between rich text and markdown view
 * Based on Lexical Playground's ActionsPlugin approach
 */
export const MarkdownToggleAction = () => {
    const [editor] = useLexicalComposerContext();

    const handleMarkdownToggle = React.useCallback(() => {
        try {
            editor.getEditorState().read(() => {
                const root = $getRoot();
                const firstChild = root.getFirstChild();
                
                // Check if we're currently in markdown mode (CodeNode with 'markdown' language)
                if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
                    // Convert FROM markdown to rich text
                    const markdownContent = firstChild.getTextContent();
                    
                    try {
                        editor.update(() => {
                            const root = $getRoot();
                            root.clear();
                            
                            $convertFromMarkdownString(
                                markdownContent,
                                TRANSFORMERS
                            );
                        });
                    } catch (error) {
                        console.error('[MARKDOWN] Error in FROM conversion update:', error);
                        throw error;
                    }
                } else {
                    // Convert TO markdown (show as CodeNode)
                    try {
                        let markdown = $convertToMarkdownString(TRANSFORMERS);
                        // Convert emojis to shortcodes (e.g., 😄 → :smile:)
                        markdown = convertEmojisToShortcodes(markdown);
                        
                        try {
                            editor.update(() => {
                                const root = $getRoot();
                                const codeNode = $createCodeNode('markdown');
                                codeNode.append($createTextNode(markdown));
                                root.clear().append(codeNode);
                                if (markdown.length === 0) {
                                    codeNode.select();
                                }
                            }, { tag: 'history-merge', discrete: true });
                        } catch (error) {
                            console.error('[MARKDOWN] Error in TO conversion update:', error);
                            throw error;
                        }
                    } catch (error) {
                        console.error('[MARKDOWN] Error in TO conversion:', error);
                        throw error;
                    }
                }
            });
        } catch (error) {
            console.error('[MARKDOWN] Top level error:', error);
        }
    }, [editor]);

    return (
        <button
            onClick={handleMarkdownToggle}
            className="popup-item spaced markdown-toggle-button"
            aria-label="Toggle Markdown"
            title="Toggle Markdown"
            style={{ marginLeft: 'auto' }}
        >
            <span>📝</span>
        </button>
    );
};
