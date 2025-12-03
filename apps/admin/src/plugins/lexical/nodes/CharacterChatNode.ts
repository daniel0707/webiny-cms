import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
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

    override createDOM(): HTMLElement {
        const dom = document.createElement('div');
        dom.className = 'character-chat';
        
        // Default to 'left' if no alignment is specified
        const alignment = this.__align || 'left';
        
        dom.setAttribute('data-align', alignment);
        dom.classList.add(`align-${alignment}`);

        // Add character name and image URL as data attributes
        dom.setAttribute('data-character', this.__characterName);
        dom.setAttribute('data-image', this.__imageUrl);

        // Style the container - children will be appended directly inside
        dom.style.display = 'block';
        dom.style.padding = '16px';
        dom.style.margin = '16px 0';
        dom.style.border = '2px solid #e0e0e0';
        dom.style.borderRadius = '12px';
        dom.style.backgroundColor = '#f9f9f9';
        dom.style.position = 'relative';
        dom.style.minHeight = '60px';

        // Create character image as absolutely positioned element
        const img = document.createElement('img');
        img.src = this.__imageUrl;
        img.alt = this.__characterName;
        img.className = 'character-chat-image';
        img.style.width = '60px';
        img.style.height = '60px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        img.style.position = 'absolute';
        img.style.top = '16px';
        img.contentEditable = 'false';
        img.setAttribute('draggable', 'false');
        
        // Position image and adjust padding based on alignment
        if (alignment === 'right') {
            img.style.right = '16px';
            dom.style.paddingRight = '84px'; // Space for the avatar on the right
            dom.style.paddingLeft = '16px';
        } else {
            img.style.left = '16px';
            dom.style.paddingLeft = '84px'; // Space for the avatar on the left
            dom.style.paddingRight = '16px';
        }

        // Append only the image - content will be added by Lexical as children
        dom.appendChild(img);

        return dom;
    }

    override updateDOM(prevNode: CharacterChatNode): boolean {
        // Return true if DOM needs to be recreated
        return (
            prevNode.__characterName !== this.__characterName ||
            prevNode.__imageUrl !== this.__imageUrl ||
            prevNode.__align !== this.__align
        );
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (!domNode.classList.contains('character-chat')) {
                    return null;
                }
                return {
                    conversion: convertCharacterChatElement,
                    priority: 2,
                };
            },
        };
    }

    override exportDOM(): DOMExportOutput {
        const element = this.createDOM();
        return { element };
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

    override isShadowRoot(): boolean {
        return true;
    }

    override canBeEmpty(): boolean {
        return false;
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

    setCharacterName(characterName: string): void {
        const writable = this.getWritable();
        writable.__characterName = characterName;
    }

    setImageUrl(imageUrl: string): void {
        const writable = this.getWritable();
        writable.__imageUrl = imageUrl;
    }

    setAlign(align?: 'left' | 'right'): void {
        const writable = this.getWritable();
        writable.__align = align;
    }
}

function convertCharacterChatElement(domNode: HTMLElement): DOMConversionOutput | null {
    const characterName = domNode.getAttribute('data-character');
    const align = domNode.getAttribute('data-align') as 'left' | 'right' | null;
    
    // Try to find the image
    const img = domNode.querySelector('img.character-chat-image') as HTMLImageElement;
    const imageUrl = img?.src || '';

    if (!characterName || !imageUrl) {
        return null;
    }

    const node = $createCharacterChatNode(
        characterName,
        imageUrl,
        align || undefined
    );

    return { node };
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
