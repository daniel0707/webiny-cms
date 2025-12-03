import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$getTableColumnIndexFromTableCellNode, $getTableNodeFromLexicalNodeOrThrow, $getTableRowIndexFromTableCellNode, $isTableCellNode, $isTableRowNode, getDOMCellFromTarget, TableCellNode} from '@lexical/table';
import {$getNearestNodeFromDOMNode} from 'lexical';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import * as React from 'react';

const MIN_COLUMN_WIDTH = 50;

export function TableCellResizer({
  editor,
}: {
  editor: ReturnType<typeof useLexicalComposerContext>[0];
}): JSX.Element {
  const [hasTable, setHasTable] = useState(false);

  useEffect(() => {
    return editor.registerMutationListener(
      TableCellNode,
      (nodeMutations) => {
        setHasTable(nodeMutations.size > 0);
      },
    );
  }, [editor]);

  if (!hasTable) {
    return <></>;
  }

  return <div className="TableCellResizer__handler" />;
}

export default function TableCellResizerPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  return <TableCellResizer editor={editor} />;
}
