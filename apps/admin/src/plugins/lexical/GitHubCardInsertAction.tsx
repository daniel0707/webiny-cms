/**
 * GitHubCardInsertAction - Toolbar button for inserting GitHub repository cards
 * 
 * Provides a dialog to enter a GitHub repository path (user/repo format)
 */

import React, { useState, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { $createGitHubCardNode } from "./nodes/GitHubCardNode";

export const GitHubCardInsertAction = () => {
    const [editor] = useLexicalComposerContext();
    const [showDialog, setShowDialog] = useState(false);
    const [repoPath, setRepoPath] = useState("");

    const handleOpenDialog = useCallback(() => {
        setShowDialog(true);
    }, []);

    const handleCloseDialog = useCallback(() => {
        setShowDialog(false);
        setRepoPath("");
    }, []);

    const insertGitHubCard = useCallback(() => {
        const trimmed = repoPath.trim();
        if (!trimmed) {
            alert('Please enter a repository path (e.g., "owner/repo") or a username/org (e.g., "withastro")');
            return;
        }

        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const githubCard = $createGitHubCardNode(trimmed);
                selection.insertNodes([githubCard]);
            }
        });

        handleCloseDialog();
    }, [editor, repoPath, handleCloseDialog]);

    return (
        <>
            <button
                onClick={handleOpenDialog}
                className="popup-item"
                title="Insert GitHub Card"
                aria-label="Insert GitHub Card"
            >
                <span>
                    <svg
                        height="18"
                        width="18"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                    >
                        <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                    </svg>
                </span>
            </button>

            <Dialog open={showDialog} onClose={handleCloseDialog}>
                <DialogTitle>Insert GitHub Card</DialogTitle>
                <DialogContent>
                    <SimpleForm>
                        <SimpleFormContent>
                            <Grid>
                                <Cell span={12}>
                                    <Input
                                        label="Repository or Username"
                                        description='Enter a repo path (e.g., "owner/repo") or a GitHub username/org (e.g., "withastro")'
                                        value={repoPath}
                                        onChange={setRepoPath}
                                        placeholder="owner/repo or username"
                                    />
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                    </SimpleForm>
                </DialogContent>
                <DialogActions>
                    <ButtonDefault onClick={handleCloseDialog}>Cancel</ButtonDefault>
                    <ButtonPrimary onClick={insertGitHubCard}>Insert</ButtonPrimary>
                </DialogActions>
            </Dialog>
        </>
    );
};
