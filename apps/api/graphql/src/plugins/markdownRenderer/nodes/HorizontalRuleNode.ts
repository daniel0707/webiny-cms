/**
 * Server-side HorizontalRuleNode for headless Lexical editor
 * 
 * Simplified version that doesn't require React.
 * Based on @lexical/react/LexicalHorizontalRuleNode but using ElementNode.
 */

import {
    DecoratorNode,
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    LexicalNode,
    SerializedLexicalNode,
} from 'lexical';

export type SerializedHorizontalRuleNode = SerializedLexicalNode;

export class HorizontalRuleNode extends DecoratorNode<null> {
    static override getType(): string {
        return 'horizontalrule';
    }

    static override clone(node: HorizontalRuleNode): HorizontalRuleNode {
        return new HorizontalRuleNode(node.__key);
    }

    static override importJSON(): HorizontalRuleNode {
        return $createHorizontalRuleNode();
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            hr: () => ({
                conversion: convertHorizontalRuleElement,
                priority: 0,
            }),
        };
    }

    override exportDOM(): DOMExportOutput {
        return { element: document.createElement('hr') };
    }

    override exportJSON(): SerializedLexicalNode {
        return {
            type: 'horizontalrule',
            version: 1,
        };
    }

    override createDOM(): HTMLElement {
        const element = document.createElement('hr');
        return element;
    }

    override getTextContent(): string {
        return '\n';
    }

    override isInline(): false {
        return false;
    }

    override updateDOM(): boolean {
        return false;
    }

    // Return null instead of JSX for server-side
    override decorate(): null {
        return null;
    }
}

function convertHorizontalRuleElement(): DOMConversionOutput {
    return { node: $createHorizontalRuleNode() };
}

export function $createHorizontalRuleNode(): HorizontalRuleNode {
    return new HorizontalRuleNode();
}

export function $isHorizontalRuleNode(
    node: LexicalNode | null | undefined,
): node is HorizontalRuleNode {
    return node instanceof HorizontalRuleNode;
}
