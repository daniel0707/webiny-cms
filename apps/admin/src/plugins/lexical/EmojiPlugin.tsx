import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TextNode, $getSelection, $isRangeSelection } from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { nameToEmoji } from './emojiData';

/**
 * EmojiPlugin - Auto-transforms emoji shortcodes like :smile: into actual emojis
 * 
 * Behavior:
 * - In rich text mode: Watches for :shortcode: patterns and transforms them to emojis
 * - If the shortcode is not found, it leaves the text as-is
 * - Transformation happens as you type (when you complete the closing :)
 * - Cursor is placed after the emoji after transformation
 * - Does NOT transform inside CodeNodes (markdown view mode)
 */
export const EmojiPlugin = (): null => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // Register a text node transform to watch for emoji shortcodes
        const removeTransform = editor.registerNodeTransform(TextNode, (textNode) => {
            // Skip transformation if this TextNode is inside a CodeNode (markdown mode)
            const parent = textNode.getParent();
            if (parent && $isCodeNode(parent)) {
                return;
            }
            
            const textContent = textNode.getTextContent();
            
            // Match emoji shortcodes like :smile:, :rocket:, :coffee:
            // Pattern: colon, one or more word characters (letters, numbers, underscores), colon
            const emojiPattern = /:([a-zA-Z0-9_+-]+):/g;
            
            const match = emojiPattern.exec(textContent);
            
            if (match) {
                const shortcode = match[1];
                const emoji = nameToEmoji[shortcode];
                
                if (emoji) {
                    const matchStart = match.index;
                    const matchEnd = matchStart + match[0].length;
                    
                    // Get text before and after the shortcode
                    const textBefore = textContent.slice(0, matchStart);
                    const textAfter = textContent.slice(matchEnd);
                    
                    // Create the new text content with emoji
                    const newContent = textBefore + emoji + textAfter;
                    
                    // Calculate where cursor should be (after the emoji)
                    // Emoji length in JS can be > 1 due to surrogate pairs
                    const cursorPosition = textBefore.length + emoji.length;
                    
                    // Update the text content
                    textNode.setTextContent(newContent);
                    
                    // Move cursor to after the emoji
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        // Set selection to after the emoji
                        textNode.select(cursorPosition, cursorPosition);
                    }
                }
            }
        });

        return () => {
            removeTransform();
        };
    }, [editor]);

    return null;
};
