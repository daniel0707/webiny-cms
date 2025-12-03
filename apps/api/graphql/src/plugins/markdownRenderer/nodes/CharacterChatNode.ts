/**
 * Server-side CharacterChatNode for headless Lexical editor
 * 
 * This is a simplified version without DOM dependencies.
 * Only needs serialization/deserialization for markdown conversion.
 */

import type {
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread,
} from 'lexical';
import { ElementNode } from 'lexical';

export type SerializedCharacterChatNode = Spread<
    {
        characterName: string;
        imageUrl: string;
        align?: 'left' | 'right';
    },
    SerializedElementNode
>;

export class CharacterChatNode extends ElementNode {
    __characterName: string;
    __imageUrl: string;
    __align?: 'left' | 'right';

    static override getType(): string {
        return 'character-chat';
    }

    static override clone(node: CharacterChatNode): CharacterChatNode {
        return new CharacterChatNode(
            node.__characterName,
            node.__imageUrl,
            node.__align,
            node.__key
        );
    }

    constructor(characterName: string, imageUrl: string, align?: 'left' | 'right', key?: NodeKey) {
        super(key);
        this.__characterName = characterName;
        this.__imageUrl = imageUrl;
        this.__align = align;
    }

    // Server-side: minimal DOM creation (jsdom will provide document)
    override createDOM(): HTMLElement {
        const dom = document.createElement('div');
        dom.className = 'character-chat';
        return dom;
    }

    override updateDOM(): boolean {
        return false;
    }

    static override importJSON(serializedNode: SerializedCharacterChatNode): CharacterChatNode {
        const node = $createCharacterChatNode(
            serializedNode.characterName,
            serializedNode.imageUrl,
            serializedNode.align
        );
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override exportJSON(): SerializedCharacterChatNode {
        return {
            ...super.exportJSON(),
            characterName: this.__characterName,
            imageUrl: this.__imageUrl,
            align: this.__align,
            type: 'character-chat',
            version: 1,
        };
    }

    getCharacterName(): string {
        return this.__characterName;
    }

    getImageUrl(): string {
        return this.__imageUrl;
    }

    getAlign(): 'left' | 'right' | undefined {
        return this.__align;
    }

    override isShadowRoot(): boolean {
        return true;
    }

    override canBeEmpty(): boolean {
        return false;
    }
}

export function $createCharacterChatNode(
    characterName: string,
    imageUrl: string,
    align?: 'left' | 'right'
): CharacterChatNode {
    return new CharacterChatNode(characterName, imageUrl, align);
}

export function $isCharacterChatNode(
    node: LexicalNode | null | undefined
): node is CharacterChatNode {
    return node instanceof CharacterChatNode;
}
