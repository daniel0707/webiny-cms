# Lexical Markdown Extension for Webiny CMS

This extension adds markdown toggle functionality to the Lexical editor, based on the [Lexical Playground's ActionsPlugin](https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/ActionsPlugin/index.tsx) approach.

## Features

- **Manual Markdown Mode**: Toggle between rich text editor and markdown source view
- **Bidirectional Conversion**: Rich text ↔ Markdown conversion on demand
- **CodeNode Display**: Uses Lexical's CodeNode with `language='markdown'` to display markdown source
- **No Auto-Transformation**: Full control - no automatic markdown shortcuts
- **Markdown-Only Toolbar**: Removed underline, font-size, text-alignment, and font-color buttons (not supported in markdown)
- **Asterisk-Only Formatting**: Only `*` and `**` for bold/italic (underscore variants removed for consistency)

## How It Works

Click the 📝 button in the editor toolbar to toggle between:

1. **Rich Text Mode**: Normal WYSIWYG editor with formatting toolbar
2. **Markdown Mode**: Markdown source displayed in a CodeNode (syntax-highlighted code block)

The toggle works by:
- **To Markdown**: Converts editor content to markdown string, wraps it in a CodeNode with `language='markdown'`
- **From Markdown**: Checks if root's first child is a CodeNode with `language='markdown'`, converts its text content back to rich text

This is much cleaner than an overlay approach - the markdown is just another node in the editor!

## Supported Markdown

- **Headings**: `# H1` through `###### H6`
- **Bold**: `**bold**` (asterisks only, underscores removed)
- **Italic**: `*italic*` (asterisks only, underscores removed)
- **Strikethrough**: `~~text~~`
- **Inline code**: `` `code` ``
- **Code blocks**: ``` with language support
- **Links**: `[text](url)`
- **Lists**: `-`, `*`, `+` for unordered, `1.` for ordered
- **Quotes**: `> quote`

**Note**: Font size, text alignment, font color, and underline formatting are disabled as they're not supported in markdown spec.

## File Structure

```
apps/admin/src/plugins/lexical/
├── index.ts                      # Main export
├── markdownPlugin.tsx            # Plugin registration
├── MarkdownToggleAction.tsx      # Toggle button logic
└── README.md                     # This file
```

## Installation

Already installed via `Extensions.tsx`:

```tsx
import { MarkdownPlugin } from "./plugins/lexical";

export const Extensions = () => {
    return (
        <LexicalEditorConfig>
            <MarkdownPlugin />
        </LexicalEditorConfig>
    );
};
```

## Implementation Details

Based on Lexical Playground's pattern:

```typescript
const handleMarkdownToggle = () => {
    editor.update(() => {
        const root = $getRoot();
        const firstChild = root.getFirstChild();
        
        if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
            // Convert FROM markdown to rich text
            $convertFromMarkdownString(firstChild.getTextContent(), TRANSFORMERS);
        } else {
            // Convert TO markdown
            const markdown = $convertToMarkdownString(TRANSFORMERS);
            const codeNode = $createCodeNode('markdown');
            codeNode.append($createTextNode(markdown));
            root.clear().append(codeNode);
        }
    });
};
```

## Next Steps (from TODO.md)

- Remove non-markdown toolbar features
- Backend: Lexical JSON → Markdown transformer
- Custom markdown extensions (admonitions, character chats, GitHub cards, emoji)
- Special image handling (#pixelated, figcaptions)
