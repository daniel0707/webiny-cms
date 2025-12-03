// This file is automatically updated via scaffolding utilities.
// Learn more about extensions: https://webiny.link/extensions
import React from "react";
import { LexicalEditorConfig } from "@webiny/app-headless-cms/admin/lexicalConfig/LexicalEditorConfig";
import { MarkdownPlugin } from "./plugins/lexical";

export const Extensions = () => {
    return (
        <LexicalEditorConfig>
            <MarkdownPlugin />
        </LexicalEditorConfig>
    );
};
