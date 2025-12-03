import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $createTextNode } from "lexical";
import { emojiCategories } from "./emojiData";

/**
 * EmojiPickerAction - Toolbar button with emoji picker dropdown
 * 
 * Features:
 * - Categories: Smileys & Emotion, People & Body, Animals & Nature, etc.
 * - Search by name
 * - Click to insert emoji at cursor position
 */
export const EmojiPickerAction = () => {
    const [editor] = useLexicalComposerContext();
    const [showPicker, setShowPicker] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState<string>("Smileys & Emotion");
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const pickerRef = React.useRef<HTMLDivElement>(null);

    // Close picker when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setShowPicker(false);
            }
        };

        if (showPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPicker]);

    const insertEmoji = React.useCallback((emoji: string) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const emojiNode = $createTextNode(emoji);
                selection.insertNodes([emojiNode]);
            }
        });
        setShowPicker(false);
        setSearchQuery("");
    }, [editor]);

    const handleTogglePicker = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setShowPicker(!showPicker);
    }, [showPicker]);

    // Get category names
    const categoryNames = Object.keys(emojiCategories);

    // Filter emojis based on search query
    const getFilteredEmojis = () => {
        if (searchQuery.trim()) {
            // Search across all categories
            const allEmojis: Array<{ emoji: string; name: string; aliases: string[] }> = [];
            Object.values(emojiCategories).forEach(emojis => {
                emojis.forEach(e => {
                    // Check if any alias matches the search query
                    if (e.aliases.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase()))) {
                        allEmojis.push(e);
                    }
                });
            });
            return allEmojis.slice(0, 50); // Limit to 50 results
        }
        
        // Return emojis from selected category
        return emojiCategories[selectedCategory] || [];
    };

    const filteredEmojis = getFilteredEmojis();

    // Category icons for quick visual identification
    const categoryIcons: Record<string, string> = {
        "Smileys & Emotion": "😀",
        "People & Body": "👋",
        "Animals & Nature": "🐱",
        "Food & Drink": "🍔",
        "Travel & Places": "✈️",
        "Activities": "⚽",
        "Objects": "💡",
        "Symbols": "❤️",
        "Flags": "🏳️"
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                ref={buttonRef}
                onClick={handleTogglePicker}
                className="popup-item"
                aria-label="Insert Emoji"
                title="Insert Emoji"
            >
                <span>😀</span>
            </button>
            
            {showPicker && (
                <div
                    ref={pickerRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        width: '320px',
                        marginTop: '4px'
                    }}
                >
                    {/* Search input */}
                    <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        <input
                            type="text"
                            placeholder="Search emoji..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                    </div>
                    
                    {/* Category tabs (only show when not searching) */}
                    {!searchQuery && (
                        <div 
                            style={{ 
                                display: 'flex', 
                                overflowX: 'auto', 
                                borderBottom: '1px solid #eee',
                                padding: '4px 8px'
                            }}
                        >
                            {categoryNames.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '4px 8px',
                                        border: 'none',
                                        background: selectedCategory === cat ? '#e8e8e8' : 'transparent',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        flexShrink: 0
                                    }}
                                    title={cat}
                                >
                                    {categoryIcons[cat] || "📦"}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {/* Emoji grid */}
                    <div 
                        style={{ 
                            maxHeight: '200px', 
                            overflowY: 'auto', 
                            padding: '8px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(8, 1fr)',
                            gap: '4px'
                        }}
                    >
                        {filteredEmojis.map((e, index) => (
                            <button
                                key={`${e.emoji}-${index}`}
                                onClick={() => insertEmoji(e.emoji)}
                                style={{
                                    padding: '4px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    borderRadius: '4px',
                                    lineHeight: 1
                                }}
                                title={`:${e.name}:`}
                                onMouseEnter={(ev) => {
                                    (ev.target as HTMLButtonElement).style.background = '#f0f0f0';
                                }}
                                onMouseLeave={(ev) => {
                                    (ev.target as HTMLButtonElement).style.background = 'transparent';
                                }}
                            >
                                {e.emoji}
                            </button>
                        ))}
                        {filteredEmojis.length === 0 && (
                            <div style={{ gridColumn: 'span 8', textAlign: 'center', color: '#888', padding: '16px' }}>
                                No emojis found
                            </div>
                        )}
                    </div>
                    
                    {/* Show selected emoji name */}
                    <div style={{ 
                        padding: '8px', 
                        borderTop: '1px solid #eee', 
                        fontSize: '12px', 
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        {searchQuery ? `Showing results for "${searchQuery}"` : selectedCategory}
                    </div>
                </div>
            )}
        </div>
    );
};
