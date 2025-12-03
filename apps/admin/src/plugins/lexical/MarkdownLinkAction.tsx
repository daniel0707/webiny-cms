import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@webiny/lexical-nodes";

/**
 * Custom link action button for markdown editor
 * Unlike the default LinkAction, starts with empty URL instead of "https://"
 * This is better for markdown where you often use relative links like /about or #section
 */
export const MarkdownLinkAction = () => {
    const [editor] = useLexicalComposerContext();
    const [isLink, setIsLink] = React.useState(false);

    React.useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    setIsLink(false);
                    return;
                }

                const node = selection.anchor.getNode();
                const parent = node.getParent();
                setIsLink($isLinkNode(node) || $isLinkNode(parent));
            });
        });
    }, [editor]);

    const insertLink = React.useCallback(() => {
        if (!isLink) {
            // Insert link with empty URL instead of "https://"
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
                url: ""
            });
        } else {
            // Remove link
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);

    return (
        <button
            onClick={insertLink}
            className={`popup-item spaced ${isLink ? "active" : ""}`}
            aria-label="Insert link"
            title="Insert link"
        >
            <i className="format link" />
        </button>
    );
};
