/**
 * Server-side AdmonitionNode for headless Lexical editor
 * 
 * This is a simplified version without DOM dependencies.
 * Only needs serialization/deserialization for markdown conversion.
 */

import {
    ElementNode,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread
} from 'lexical';

export type AdmonitionType = 'note' | 'tip' | 'important' | 'caution' | 'warning';

export type SerializedAdmonitionNode = Spread<
    {
        admonitionType: AdmonitionType;
    },
    SerializedElementNode
>;

export class AdmonitionNode extends ElementNode {
    __admonitionType: AdmonitionType;

    static override getType(): string {
        return 'admonition';
    }

    static override clone(node: AdmonitionNode): AdmonitionNode {
        return new AdmonitionNode(node.__admonitionType, node.__key);
    }

    constructor(admonitionType: AdmonitionType = 'note', key?: NodeKey) {
        super(key);
        this.__admonitionType = admonitionType;
    }

    // Server-side: minimal DOM creation (jsdom will provide document)
    override createDOM(): HTMLElement {
        const dom = document.createElement('div');
        dom.className = `admonition admonition-${this.__admonitionType}`;
        return dom;
    }

    override updateDOM(): boolean {
        return false;
    }

    static override importJSON(serializedNode: SerializedAdmonitionNode): AdmonitionNode {
        const node = $createAdmonitionNode(serializedNode.admonitionType);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override exportJSON(): SerializedAdmonitionNode {
        return {
            ...super.exportJSON(),
            admonitionType: this.__admonitionType,
            type: 'admonition',
            version: 1
        };
    }

    getAdmonitionType(): AdmonitionType {
        return this.__admonitionType;
    }

    override canBeEmpty(): boolean {
        return false;
    }

    override isShadowRoot(): boolean {
        return true;
    }
}

export function $createAdmonitionNode(type: AdmonitionType = 'note'): AdmonitionNode {
    return new AdmonitionNode(type);
}

export function $isAdmonitionNode(node: LexicalNode | null | undefined): node is AdmonitionNode {
    return node instanceof AdmonitionNode;
}
