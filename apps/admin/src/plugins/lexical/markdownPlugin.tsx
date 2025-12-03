import React from "react";
import { LexicalEditorConfig } from "@webiny/app-headless-cms/admin/lexicalConfig/LexicalEditorConfig";
import { LexicalEditorConfig as BaseLexicalEditorConfig } from "@webiny/lexical-editor";
import { CodeNode } from "@lexical/code";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode, ImageNode } from "@webiny/lexical-nodes";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { AdmonitionNode } from "./nodes/AdmonitionNode";
import { CharacterChatNode } from "./nodes/CharacterChatNode";
import { GitHubCardNode } from "./nodes/GitHubCardNode";
import { MarkdownToggleAction } from "./MarkdownToggleAction";
import { MarkdownLinkAction } from "./MarkdownLinkAction";
import { TableInsertAction } from "./TableInsertAction";
import { AdmonitionInsertAction } from "./AdmonitionInsertAction";
import { CharacterChatInsertAction } from "./CharacterChatInsertAction";
import { GitHubCardInsertAction } from "./GitHubCardInsertAction";
import { EscapeBlockPlugin } from "./EscapeBlockPlugin";
import { EmojiPlugin } from "./EmojiPlugin";
import { EmojiPickerAction } from "./EmojiPickerAction";

const { Node, ToolbarAction, Plugin } = LexicalEditorConfig;
const { ToolbarElement } = BaseLexicalEditorConfig;

/**
 * Markdown Plugin Configuration for Webiny Lexical Editor
 * This plugin enables manual markdown transformation via toolbar button
 * 
 * Uses Lexical Playground's approach: toggles between rich text and a CodeNode
 * with language='markdown' to display/edit markdown source
 */
export const MarkdownPlugin = () => {
    return (
        <>
            {/* Register required nodes for markdown transformers */}
            <Node name="CodeNode" node={CodeNode} />
            <Node name="HeadingNode" node={HeadingNode} />
            <Node name="QuoteNode" node={QuoteNode} />
            <Node name="ListNode" node={ListNode} />
            <Node name="ListItemNode" node={ListItemNode} />
            <Node name="LinkNode" node={LinkNode} />
            <Node name="AutoLinkNode" node={AutoLinkNode} />
            <Node name="ImageNode" node={ImageNode} />
            <Node name="HorizontalRuleNode" node={HorizontalRuleNode} />
            <Node name="TableNode" node={TableNode} />
            <Node name="TableRowNode" node={TableRowNode} />
            <Node name="TableCellNode" node={TableCellNode} />
            <Node name="AdmonitionNode" node={AdmonitionNode} />
            <Node name="CharacterChatNode" node={CharacterChatNode} />
            <Node name="GitHubCardNode" node={GitHubCardNode} />
            
            {/* Add table plugin to enable table features */}
            <Plugin
                name="table"
                element={<TablePlugin hasCellMerge={false} hasCellBackgroundColor={false} />}
            />
            
            {/* Add escape block plugin to allow exiting admonitions/character chats */}
            <Plugin
                name="escapeBlock"
                element={<EscapeBlockPlugin />}
            />
            
            {/* Add emoji plugin to auto-transform :shortcode: to emojis */}
            <Plugin
                name="emoji"
                element={<EmojiPlugin />}
            />
            
            {/* Add table insert button to toolbar */}
            <ToolbarAction
                name="tableInsert"
                element={<TableInsertAction />}
            />
            
            {/* Add admonition insert button to toolbar */}
            <ToolbarAction
                name="admonitionInsert"
                element={<AdmonitionInsertAction />}
            />
            
            {/* Add character chat insert button to toolbar */}
            <ToolbarAction
                name="characterChatInsert"
                element={<CharacterChatInsertAction />}
            />
            
            {/* Add GitHub card insert button to toolbar */}
            <ToolbarAction
                name="githubCardInsert"
                element={<GitHubCardInsertAction />}
            />
            
            {/* Add emoji picker button to toolbar */}
            <ToolbarAction
                name="emojiPicker"
                element={<EmojiPickerAction />}
            />
            
            {/* Add markdown toggle button to toolbar - placed last */}
            <ToolbarAction
                name="markdownToggle"
                element={<MarkdownToggleAction />}
            />
            
            {/* Replace default link action with markdown-friendly one (no https:// prefix) */}
            <ToolbarElement name="link" element={<MarkdownLinkAction />} />
            
            {/* Remove non-markdown features from toolbar */}
            <ToolbarElement name="underline" remove />
            <ToolbarElement name="fontSize" remove />
            <ToolbarElement name="textAlignment" remove />
            <ToolbarElement name="fontColor" remove />
        </>
    );
};
