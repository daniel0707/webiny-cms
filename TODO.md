### 2.4 WebinyCMS Configuration Changes

**CRITICAL: Lock Down & Configure Webiny Lexical Editor**

**Phase 2.4.1: Restrict Editor to Markdown-Compatible Features Only**
- [x] **Customize Webiny Lexical Editor configuration**
  - [x] Remove/disable all toolbar buttons/features that cannot be converted to markdown
    - [x] Removed underline (not in markdown spec)
    - [x] Removed font size (handled by frontend styles)
    - [x] Removed text alignment (not in markdown)
    - [x] Removed font color (not in markdown)
    - [x] Hidden alt text field in link editor (not saved to markdown links)
  - [x] Remove HTML element insertion (no raw HTML support)
  - [x] Remove custom styling options (colors, fonts, etc.)
  - [x] Remove features that don't map to markdown
  - [x] Keep ONLY markdown-compatible features:
    - [x] Paragraphs and line breaks (follows markdown spec: \n\n = paragraph)
    - [x] Headings (h1-h6)
    - [x] Bold, italic, strikethrough (asterisk-only: * and **)
    - [x] Links (custom WEBINY_LINK transformer)
    - [x] Ordered and unordered lists
    - [x] Code blocks with language selection
    - [x] Inline code
    - [x] Images (with alt text and captions via title attribute)
    - [x] Block quotes (fixed bold styling issue)
    - [x] Horizontal rules (---, ***, ___)
    - [x] Tables (GitHub Flavored Markdown table syntax - import and export with empty cell support)

**Phase 2.4.2: Add Markdown Transformation Support**
- [x] **Install/configure Lexical Markdown plugin** ✅ COMPLETE
  - [x] Add `@lexical/markdown` plugin to editor
  - [x] Configure markdown transformers for all supported features
  - [x] Test bidirectional conversion (markdown → editor, editor → markdown)
  - [x] Created custom WEBINY_LINK transformer (uses Webiny's LinkNode instead of @lexical/link)
  - [x] Created custom WEBINY_IMAGE transformer (supports captions via title attribute)
  - [x] Created HORIZONTAL_RULE transformer (supports ---, ***, ___)
  - [x] Created TABLE transformer (GitHub Flavored Markdown syntax, export-only)
  - [x] Removed underscore formatting variants (only asterisks: * for italic, ** for bold)
  - [x] Added markdown toggle button to toolbar
  - [x] Registered all required nodes: CodeNode, HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode, HorizontalRuleNode, TableNode, TableRowNode, TableCellNode
  - [x] Custom MarkdownLinkAction (starts with empty URL instead of "https://")

**Phase 2.4.3: Support Special Markdown Features from Astro**
This blog uses custom markdown extensions that need Webiny support:

- [x] **Admonitions** (via remark-directive): ✅ COMPLETE
  ```markdown
  :::note
  This is a note
  :::
  
  :::tip
  Helpful tip here
  :::
  
  :::important | :::caution | :::warning
  ```
  - [x] Created custom AdmonitionNode extending ElementNode
  - [x] Created ADMONITION ElementTransformer (bidirectional markdown conversion)
  - [x] Added AdmonitionInsertAction toolbar button with dropdown menu
  - [x] Supports all 5 types: note (blue), tip (green), important (purple), caution (yellow), warning (red)
  - [x] Handles single-line and multi-paragraph formats
  - [x] Preserves content before/after admonition markers
  - [x] Type-specific icons: ℹ️ (note), 💡 (tip), ❗ (important), ⚠️ (caution), 🚫 (warning)
  - [x] Escape behavior: double-Enter to exit admonition blocks

- [x] **Character Chats** (custom remark plugin): ✅ COMPLETE
  ```markdown
  :::characterName[imageURL]
  Message from character
  :::
  
  :::owl[https://...]{align="right"}
  Message with alignment
  :::
  ```
  - [x] Created custom CharacterChatNode extending ElementNode
  - [x] Created CHARACTER_CHAT ElementTransformer (bidirectional markdown conversion)
  - [x] Added CharacterChatInsertAction toolbar button with dialog form
  - [x] Format: `:::name[url]{align="left|right"}` (no parentheses around name)
  - [x] Supports optional alignment: left, right, or auto-alternating (undefined)
  - [x] Import handled by ADMONITION transformer (checks for `[` after name)
  - [x] Character name validation: letters, numbers, dots, underscores, dashes
  - [x] Dialog with 3 fields: character name, image picker (FileManager), alignment selector
  - [x] Image selection via Webiny FileManager (upload or select existing)
  - [x] Registered CharacterChatNode and added toolbar button
  - [x] Visual alignment: avatar and text positioning reflects chosen alignment option
  - [x] Escape behavior: double-Enter to exit character chat blocks
  - [x] Icon differentiation: admonition button uses ⚠️, chat uses 💬

- [x] **GitHub Cards** (custom remark plugin): ✅ COMPLETE
  ```markdown
  :::github{owner/repo}
  ```
  - [x] Created custom GitHubCardNode extending ElementNode
  - [x] Created GITHUB_CARD ElementTransformer (single-line pattern)
  - [x] Added GitHubCardInsertAction toolbar button with dialog
  - [x] Format: `:::github{user/repo}` (no closing :::)
  - [x] Renders as clickable GitHub icon + repo path link
  - [x] Validates repo path contains `/` separator
  - [x] Automatically prepends `https://github.com/` to links
  - [x] Registered GitHubCardNode and added toolbar button
  - [x] Escape behavior: single-Enter inserts paragraph after card

- [x] **Emoji Shortcodes** (remark-gemoji): ✅ COMPLETE
  ```markdown
  :star_struck: :coffee: :rocket:
  ```
  - [x] Add emoji picker to editor with category tabs and search
  - [x] Auto-transform :shortcode: to emoji while typing in rich text mode
  - [x] Created emojiData.ts with 1900+ GitHub emoji shortcodes
  - [x] EmojiPlugin: Watches for :shortcode: patterns and transforms to emojis
  - [x] EMOJI transformer: Converts emojis ↔ shortcodes during markdown import/export
  - [x] EmojiPickerAction: Toolbar button with category-organized emoji picker
  - [x] Markdown export: Emojis converted back to :shortcode: format
  - [x] Invalid shortcodes left as-is (not converted)
  - [x] EmojiPlugin skips CodeNode children (markdown view mode)
  - [x] Fixed markdown display bug: removed skipTransforms for proper multi-line display

- ~~**LaTeX/KaTeX Math**~~ (SKIPPED - not needed for this blog)

- [x] **Special Image Handling**: ✅ COMPLETE
  ```markdown
  ![alt text](url "title for figcaption")
  ![alt text #pixelated](url)
  ```
  - [x] Support image title attribute for figcaptions (handled by WEBINY_IMAGE transformer)
  - [x] Support `#pixelated` tag in alt text for pixel art CSS (frontend handles this)
  - [x] Image uploads working via FileManager

### 2.5 Backend Markdown Transformer

**Goal:** Create a backend service that converts Lexical JSON (stored in Webiny) to Markdown string for the Astro frontend.

**Phase 2.5.1: Research & Architecture** ✅ COMPLETE
- [x] **Understand Webiny's data flow**
  - [x] Lexical JSON stored in CMS rich text fields (JSON with `root` property)
  - [x] `createRichTextRenderer(format, renderFn)` creates custom format handlers
  - [x] GraphQL query: `content(format: "markdown")` invokes renderer with matching format
  - [x] Renderers are registered as plugins in `apps/api/graphql/src/index.ts`

- [x] **Implementation approach: `createRichTextRenderer` + `@lexical/headless`**
  - Following the existing HTML renderer pattern (`LexicalRenderer`)
  - Uses `createHeadlessEditor()` from `@lexical/headless` for server-side Lexical
  - Uses `$convertToMarkdownString()` from `@lexical/markdown` for output
  - Must register custom nodes: AdmonitionNode, CharacterChatNode, GitHubCardNode
  - Must provide custom transformers matching frontend transformers

**Key Architecture Discovery:**
```typescript
// Webiny's existing HTML renderer pattern:
createRichTextRenderer({
  format: "html",
  render: (contents, next) => {
    if (!isLexicalContents(contents)) return next(contents);
    const renderer = new LexicalRenderer();
    return renderer.render(contents);
  }
});

// Our markdown renderer will follow same pattern:
createRichTextRenderer({
  format: "markdown",
  render: (contents, next) => {
    if (!isLexicalContents(contents)) return next(contents);
    const renderer = new MarkdownRenderer();
    return renderer.render(contents);
  }
});
```

**Challenge: Shared Custom Nodes**
- Custom nodes (AdmonitionNode, CharacterChatNode, GitHubCardNode) are in admin package
- Backend needs access to these nodes for headless editor
- Solution: ✅ Created server-side copies in `apps/api/graphql/src/plugins/markdownRenderer/nodes/`

**Phase 2.5.2: Create Lexical JSON → Markdown Transformer** ✅ COMPLETE
- [x] **Core transformer implemented**
  - [x] Created `MarkdownRenderer` class in `apps/api/graphql/src/plugins/markdownRenderer/`
  - [x] Uses `@lexical/headless` to create headless editor
  - [x] Uses `$convertToMarkdownString()` from `@lexical/markdown` for output
  - [x] Registered all required nodes (Webiny's allNodes + custom nodes + table)
  - [x] Created server-side custom nodes (simplified, no DOM dependencies)
  - [x] Created custom transformers matching frontend transformers
  - [x] Emoji → shortcode conversion post-processing

**Files created:**
```
apps/api/graphql/src/plugins/markdownRenderer/
├── index.ts                 # createMarkdownRenderer() plugin
├── MarkdownRenderer.ts      # Core renderer class
├── customTransformers.ts    # Custom markdown transformers
├── emojiData.ts            # emojiToName mapping
└── nodes/
    ├── index.ts
    ├── AdmonitionNode.ts    # Server-side copy
    ├── CharacterChatNode.ts # Server-side copy
    ├── GitHubCardNode.ts    # Server-side copy
    └── HorizontalRuleNode.ts # Server-side copy
```

**Dependencies added to api-graphql:**
- `@webiny/lexical-converter`: For compatible Lexical types
- `@lexical/markdown@0.23.1`: Markdown conversion
- `@lexical/table@0.23.1`: Table node support
- `lexical@0.23.1`: Core Lexical (matching Webiny's version)
- `jsdom`: Server-side DOM for node createDOM methods

**Phase 2.5.3: Integrate with GraphQL** ✅ COMPLETE
- [x] Registered renderer in `apps/api/graphql/src/extensions.ts`
- [x] Plugin loaded via `createMarkdownRenderer()` function
- [x] Available as `content(format: "markdown")` in GraphQL queries

**Phase 2.5.4: Testing** ✅ COMPLETE
- [x] Deploy to dev environment
- [x] **Custom nodes persisting correctly** (was a stale admin build issue)
- [x] Query content with `format: "markdown"` parameter
- [x] Verify output matches expected markdown syntax
- [x] Test with various content types:
  - [x] Basic text with formatting
  - [x] Headings (h1-h6) - required custom WEBINY_HEADING transformer
  - [x] Lists (bullet, numbered, checkbox) - required custom WEBINY_LIST transformer
  - [x] Quotes - required custom WEBINY_QUOTE transformer
  - [x] Code blocks with languages
  - [x] Tables
  - [x] Images with captions
  - [x] Admonitions
  - [x] Character chats
  - [x] GitHub cards
  - [x] Emojis (converted to shortcodes via post-processing)
- [x] **Edge cases handled**
  - [x] Empty content (returns undefined, falls through to next renderer)
  - [x] Nested lists
  - [x] Mixed formatting (bold + italic)
  - [x] Multi-paragraph admonitions/character chats

**Phase 2.5.5: Frontend List Transformers** ✅ COMPLETE
- [x] Added WEBINY_UNORDERED_LIST, WEBINY_ORDERED_LIST, WEBINY_CHECK_LIST transformers
- [x] Fixed markdown toggle button converting lists to single line of text
- [x] Lists now properly export/import in markdown format in the editor

**Note:** Webiny uses custom node classes that replace Lexical's built-in nodes:
- `HeadingNode` (type: "heading-element") replaces `@lexical/rich-text.HeadingNode`
- `QuoteNode` (type: "quote-element") replaces `@lexical/rich-text.QuoteNode`  
- `ListNode` (type: "webiny-list") extends `ElementNode` directly
- `ListItemNode` (type: "webiny-listitem") extends `ElementNode` directly

These required custom transformers since Lexical's built-in markdown transformers check for the wrong node types.

---

### 2.6 Expressive Code Support

**Goal:** Full [expressive-code](https://expressive-code.com) integration in the Lexical editor so that code block metadata (title, line highlights, `wrap`, etc.) is stored, validated, and rendered correctly.

**Phase 2.6.1: Preserve metadata on the opening ``` line** ✅ COMPLETE
- [x] Created custom `WEBINY_CODE` transformer (admin + server) using `regExpStart: /^[ \t]*```([^\n]*)/`
  - Captures the **full** rest of the opening line instead of just `(\w+)?`
  - Stored verbatim in `CodeNode.__language`, round-trips through markdown toggle and GraphQL export
  - Replaces Lexical's default `CODE` transformer in both `MarkdownToggleAction` and `MarkdownRenderer`

**Phase 2.6.2: Editor-side expressive-code support** 🔲 TODO
- [ ] **Validate code block meta in the editor**
  - Parse and enforce valid expressive-code option syntax on the opening ``` line
  - Show error/warning when unsupported options are typed
  - Provide an info tooltip or CodeBlockOptionsAction toolbar button listing supported options
- [ ] **Render expressive-code options visually in Rich Text Mode**
  - Show `title` as a visible header on the code block
  - Highlight the specified lines (`{1,3}`, `{2-5}`)
  - Indicate `wrap`, `ins`/`del` markers, etc. with visible styling
  - Consider a click-to-configure toolbar popup for common options (language, title, wrap, line ranges)
- [ ] **Supported expressive-code options to handle:**
  - `title="..."` — file name caption
  - `{N}` / `{N-M}` / `{N,M}` — line highlight ranges
  - `ins={N}` / `del={N}` — insertion/deletion markers
  - `wrap` — word wrap flag
  - `showLineNumbers` — show/hide line numbers
  - `startLineNumber=N` — start line number override
  - `frame="..."` — code/terminal/none/auto frame type

---

## ✅ PHASE 2 COMPLETE - CMS Ready for Production!

All markdown features implemented and tested:
- Rich text ↔ Markdown bidirectional conversion
- Backend API returns markdown via `content(format: "markdown")`
- Custom nodes: Admonitions, Character Chats, GitHub Cards
- Emoji shortcodes, Tables, Images with captions
- All Webiny custom nodes handled with custom transformers
