import {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
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

/**
 * AdmonitionNode represents a callout/admonition block
 * Supports types: note, tip, important, caution, warning
 * Exports to markdown as: :::type\ncontent\n:::
 */
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

    override createDOM(): HTMLElement {
        const dom = document.createElement('div');
        dom.className = `admonition admonition-${this.__admonitionType}`;
        // Add some basic styling to make it visible in the editor
        dom.style.padding = '12px 16px';
        dom.style.paddingLeft = '40px';
        dom.style.margin = '12px 0';
        dom.style.borderLeft = '4px solid';
        dom.style.borderRadius = '4px';
        dom.style.position = 'relative';
        
        // Icon element
        const icon = document.createElement('span');
        icon.className = 'admonition-icon';
        icon.style.position = 'absolute';
        icon.style.left = '12px';
        icon.style.top = '12px';
        icon.style.fontSize = '18px';
        icon.style.lineHeight = '1';
        icon.contentEditable = 'false';
        
        // Color coding and icon based on type
        switch (this.__admonitionType) {
            case 'note':
                dom.style.borderColor = '#0969da';
                dom.style.backgroundColor = '#ddf4ff';
                icon.textContent = 'ℹ️';
                break;
            case 'tip':
                dom.style.borderColor = '#1a7f37';
                dom.style.backgroundColor = '#dafbe1';
                icon.textContent = '💡';
                break;
            case 'important':
                dom.style.borderColor = '#8250df';
                dom.style.backgroundColor = '#fbefff';
                icon.textContent = '❗';
                break;
            case 'caution':
                dom.style.borderColor = '#bf8700';
                dom.style.backgroundColor = '#fff8c5';
                icon.textContent = '⚠️';
                break;
            case 'warning':
                dom.style.borderColor = '#cf222e';
                dom.style.backgroundColor = '#ffebe9';
                icon.textContent = '🚫';
                break;
        }
        
        dom.appendChild(icon);
        
        return dom;
    }

    override updateDOM(prevNode: AdmonitionNode): boolean {
        // Return true if the admonition type changed (forces re-creation)
        return prevNode.__admonitionType !== this.__admonitionType;
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (!domNode.classList.contains('admonition')) {
                    return null;
                }
                return {
                    conversion: convertAdmonitionElement,
                    priority: 1
                };
            }
        };
    }

    override exportDOM(): DOMExportOutput {
        const element = this.createDOM();
        return { element };
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

    setAdmonitionType(type: AdmonitionType): void {
        const writable = this.getWritable();
        writable.__admonitionType = type;
    }

    // Block-level element
    override canBeEmpty(): boolean {
        return false;
    }

    override isShadowRoot(): boolean {
        return true;
    }
}

function convertAdmonitionElement(domNode: HTMLElement): DOMConversionOutput | null {
    const type = domNode.className
        .split(' ')
        .find(cls => cls.startsWith('admonition-'))
        ?.replace('admonition-', '') as AdmonitionType;
    
    if (type) {
        const node = $createAdmonitionNode(type);
        return { node };
    }
    return null;
}

export function $createAdmonitionNode(type: AdmonitionType = 'note'): AdmonitionNode {
    return new AdmonitionNode(type);
}

export function $isAdmonitionNode(node: LexicalNode | null | undefined): node is AdmonitionNode {
    return node instanceof AdmonitionNode;
}
