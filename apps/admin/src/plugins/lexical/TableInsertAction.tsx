import React from "react";
import { Dialog, DialogTitle, DialogContent } from "@webiny/ui/Dialog";
import { InsertTableDialog } from "./InsertTableDialog";

/**
 * Toolbar action button to insert a table into the editor
 * Opens a dialog to specify table dimensions
 */
export const TableInsertAction = () => {
    const [showDialog, setShowDialog] = React.useState(false);

    const handleOpenDialog = React.useCallback(() => {
        setShowDialog(true);
    }, []);

    const handleCloseDialog = React.useCallback(() => {
        setShowDialog(false);
    }, []);

    return (
        <>
            <button
                onClick={handleOpenDialog}
                className="popup-item"
                aria-label="Insert Table"
            >
                <span>⊞</span>
            </button>
            <Dialog open={showDialog} onClose={handleCloseDialog}>
                <DialogTitle>Insert Table</DialogTitle>
                <DialogContent>
                    <InsertTableDialog onClose={handleCloseDialog} />
                </DialogContent>
            </Dialog>
        </>
    );
};
