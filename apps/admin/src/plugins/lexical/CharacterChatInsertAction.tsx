import React, { useState, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $getSelection, $isRangeSelection } from "lexical";
import { $createCharacterChatNode } from "./nodes/CharacterChatNode";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { FileManager, FileManagerFileItem } from "@webiny/app-admin";

export const CharacterChatInsertAction = () => {
    const [editor] = useLexicalComposerContext();
    const [showDialog, setShowDialog] = useState(false);
    const [characterName, setCharacterName] = useState("");
    const [selectedImage, setSelectedImage] = useState<FileManagerFileItem | null>(null);
    const [align, setAlign] = useState<"left" | "right" | undefined>(undefined);
    
    // Store a ref to the showFileManager function so we can call it from outside the render prop
    const showFileManagerRef = useRef<((onChange: (file: FileManagerFileItem) => void) => void) | null>(null);

    const handleOpenDialog = React.useCallback(() => {
        setShowDialog(true);
    }, []);

    const handleCloseDialog = React.useCallback(() => {
        setShowDialog(false);
        setCharacterName("");
        setSelectedImage(null);
        setAlign(undefined);
    }, []);

    const handleSelectImage = React.useCallback(() => {
        // Hide dialog temporarily while file manager is open
        setShowDialog(false);
        
        // Small delay to let dialog close before opening file manager
        setTimeout(() => {
            if (showFileManagerRef.current) {
                showFileManagerRef.current((file: FileManagerFileItem) => {
                    setSelectedImage(file);
                    // Reopen dialog after selection
                    setShowDialog(true);
                });
            }
        }, 100);
    }, []);

    const insertCharacterChat = React.useCallback(() => {
        if (!characterName || !selectedImage) {
            return;
        }

        editor.update(() => {
            const selection = $getSelection();
            
            if ($isRangeSelection(selection)) {
                const characterChat = $createCharacterChatNode(
                    characterName,
                    selectedImage.src,
                    align
                );
                const paragraph = $createParagraphNode();
                characterChat.append(paragraph);
                
                selection.insertNodes([characterChat]);
                paragraph.select();
            }
        });

        handleCloseDialog();
    }, [editor, characterName, selectedImage, align, handleCloseDialog]);

    return (
        <>
            <button
                onClick={handleOpenDialog}
                className="popup-item"
                aria-label="Insert Character Chat"
                title="Insert Character Chat"
            >
                <span>💬</span>
            </button>
            
            {/* FileManager needs to be outside the Dialog to work properly */}
            <FileManager
                accept={["image/*"]}
                render={({ showFileManager }) => {
                    // Store the showFileManager function in a ref
                    showFileManagerRef.current = showFileManager;
                    return null;
                }}
            />
            
            <Dialog open={showDialog} onClose={handleCloseDialog}>
                <DialogTitle>Insert Character Chat</DialogTitle>
                <DialogContent>
                    <SimpleForm>
                        <SimpleFormContent>
                            <Grid>
                                <Cell span={12}>
                                    <Input
                                        label="Character Name"
                                        placeholder="Enter character name"
                                        value={characterName}
                                        onChange={setCharacterName}
                                    />
                                </Cell>
                                <Cell span={12}>
                                    <div style={{ marginBottom: "8px" }}>
                                        <label style={{ fontSize: "12px", color: "var(--mdc-theme-text-secondary-on-background)", marginBottom: "4px", display: "block" }}>
                                            Character Image
                                        </label>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            {selectedImage ? (
                                                <img 
                                                    src={selectedImage.src} 
                                                    alt="Selected" 
                                                    style={{ 
                                                        width: "60px", 
                                                        height: "60px", 
                                                        borderRadius: "50%", 
                                                        objectFit: "cover",
                                                        border: "2px solid #e0e0e0"
                                                    }} 
                                                />
                                            ) : (
                                                <div style={{ 
                                                    width: "60px", 
                                                    height: "60px", 
                                                    borderRadius: "50%", 
                                                    backgroundColor: "#f0f0f0",
                                                    border: "2px dashed #ccc",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "24px",
                                                    color: "#999"
                                                }}>
                                                    ?
                                                </div>
                                            )}
                                            <ButtonDefault onClick={handleSelectImage}>
                                                {selectedImage ? "Change Image" : "Select Image"}
                                            </ButtonDefault>
                                        </div>
                                    </div>
                                </Cell>
                                <Cell span={12}>
                                    <Select
                                        label="Alignment"
                                        value={align || "auto"}
                                        onChange={(value: string) => {
                                            setAlign(value === "auto" ? undefined : value as "left" | "right");
                                        }}
                                    >
                                        <option value="auto">Auto (alternating)</option>
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                    </Select>
                                </Cell>
                                <Cell span={12} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                    <ButtonDefault onClick={handleCloseDialog}>Cancel</ButtonDefault>
                                    <ButtonPrimary 
                                        onClick={insertCharacterChat}
                                        disabled={!characterName || !selectedImage}
                                    >
                                        Insert
                                    </ButtonPrimary>
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                    </SimpleForm>
                </DialogContent>
            </Dialog>
        </>
    );
};
