import React, { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { SimpleForm, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";

interface InsertTableDialogProps {
    onClose: () => void;
}

export const InsertTableDialog: React.FC<InsertTableDialogProps> = ({ onClose }) => {
    const [editor] = useLexicalComposerContext();
    const [rows, setRows] = useState("3");
    const [columns, setColumns] = useState("3");
    const [isDisabled, setIsDisabled] = useState(false);

    useEffect(() => {
        const row = Number(rows);
        const column = Number(columns);
        if (row && row > 0 && row <= 50 && column && column > 0 && column <= 50) {
            setIsDisabled(false);
        } else {
            setIsDisabled(true);
        }
    }, [rows, columns]);

    const handleInsert = () => {
        editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            columns,
            rows,
            includeHeaders: true
        });
        onClose();
    };

    return (
        <SimpleForm>
            <SimpleFormContent>
                <Grid>
                    <Cell span={12}>
                        <Input
                            label="Rows"
                            placeholder="# of rows (1-50)"
                            type="number"
                            value={rows}
                            onChange={setRows}
                        />
                    </Cell>
                    <Cell span={12}>
                        <Input
                            label="Columns"
                            placeholder="# of columns (1-50)"
                            type="number"
                            value={columns}
                            onChange={setColumns}
                        />
                    </Cell>
                    <Cell span={12} style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
                        <ButtonPrimary onClick={handleInsert} disabled={isDisabled}>
                            Insert Table
                        </ButtonPrimary>
                    </Cell>
                </Grid>
            </SimpleFormContent>
        </SimpleForm>
    );
};
