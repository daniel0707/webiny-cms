import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $getSelection, $isRangeSelection } from "lexical";
import { $createAdmonitionNode, AdmonitionType } from "./nodes/AdmonitionNode";

/**
 * Toolbar action to insert admonitions
 * Provides a dropdown menu with all admonition types
 */
export const AdmonitionInsertAction = () => {
    const [editor] = useLexicalComposerContext();
    const [showMenu, setShowMenu] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const insertAdmonition = React.useCallback((type: AdmonitionType) => {
        editor.update(() => {
            const selection = $getSelection();
            
            if ($isRangeSelection(selection)) {
                const admonition = $createAdmonitionNode(type);
                const paragraph = $createParagraphNode();
                admonition.append(paragraph);
                
                selection.insertNodes([admonition]);
                paragraph.select();
            }
        });
        
        setShowMenu(false);
    }, [editor]);

    const handleToggleMenu = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setShowMenu(!showMenu);
    }, [showMenu]);

    const admonitionTypes: Array<{ type: AdmonitionType; label: string; emoji: string }> = [
        { type: 'note', label: 'Note', emoji: '📝' },
        { type: 'tip', label: 'Tip', emoji: '💡' },
        { type: 'important', label: 'Important', emoji: '❗' },
        { type: 'caution', label: 'Caution', emoji: '⚠️' },
        { type: 'warning', label: 'Warning', emoji: '🚫' }
    ];

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                ref={buttonRef}
                onClick={handleToggleMenu}
                className="popup-item"
                aria-label="Insert Admonition"
                title="Insert Admonition"
            >
                <span>⚠️</span>
            </button>
            
            {showMenu && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        minWidth: '150px',
                        marginTop: '4px'
                    }}
                >
                    {admonitionTypes.map(({ type, label, emoji }) => (
                        <button
                            key={type}
                            onClick={() => insertAdmonition(type)}
                            className="popup-item"
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{ marginRight: '8px' }}>{emoji}</span>
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
