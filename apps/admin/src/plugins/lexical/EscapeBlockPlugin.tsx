/**
 * EscapeBlockPlugin - Allows escaping from custom block nodes
 * 
 * Handles Enter key at the end of admonitions, character chats, etc.
 * to insert a new paragraph after the block node
 */

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    $createParagraphNode,
    COMMAND_PRIORITY_LOW,
    KEY_ENTER_COMMAND
} from "lexical";
import { $isAdmonitionNode } from "./nodes/AdmonitionNode";
import { $isCharacterChatNode } from "./nodes/CharacterChatNode";
import { $isGitHubCardNode } from "./nodes/GitHubCardNode";

export const EscapeBlockPlugin = (): null => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event: KeyboardEvent) => {
                const selection = $getSelection();
                
                if (!$isRangeSelection(selection)) {
                    return false;
                }

                // Get the current node and its parent
                const anchorNode = selection.anchor.getNode();
                const elementNode = anchorNode.getTopLevelElementOrThrow();
                const parent = elementNode.getParent();

                // Check if we're inside an admonition or character chat
                if ($isAdmonitionNode(parent) || $isCharacterChatNode(parent)) {
                    // Check if cursor is in the last paragraph AND that paragraph is empty
                    const lastChild = parent.getLastChild();
                    
                    if (elementNode === lastChild) {
                        const textContent = elementNode.getTextContent();
                        
                        // Only escape if the paragraph is completely empty (double Enter behavior)
                        if (textContent.length === 0) {
                            event.preventDefault();
                            
                            // Remove the empty paragraph inside the block
                            elementNode.remove();
                            
                            // Create a new paragraph after the parent block
                            const newParagraph = $createParagraphNode();
                            parent.insertAfter(newParagraph);
                            newParagraph.select();
                            
                            return true;
                        }
                    }
                }
                
                // Check if the element itself is a GitHub card (leaf element)
                if ($isGitHubCardNode(elementNode)) {
                    event.preventDefault();
                    
                    // Create a new paragraph after the GitHub card
                    const newParagraph = $createParagraphNode();
                    elementNode.insertAfter(newParagraph);
                    newParagraph.select();
                    
                    return true;
                }

                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);

    return null;
};
