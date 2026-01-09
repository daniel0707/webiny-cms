/**
 * GitHubCardNode - Custom Lexical node for GitHub repository/user cards
 * 
 * Renders as a clickable link with GitHub icon
 * Format: :::github{user/repo}
 */

import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread
} from 'lexical';

import { ElementNode } from 'lexical';

export type SerializedGitHubCardNode = Spread<
    {
        repoPath: string;
    },
    SerializedElementNode
>;

export class GitHubCardNode extends ElementNode {
    __repoPath: string;

    static override getType(): string {
        return 'github-card';
    }

    static override clone(node: GitHubCardNode): GitHubCardNode {
        return new GitHubCardNode(node.__repoPath, node.__key);
    }

    constructor(repoPath: string, key?: NodeKey) {
        super(key);
        this.__repoPath = repoPath;
    }

    getRepoPath(): string {
        return this.__repoPath;
    }

    setRepoPath(repoPath: string): void {
        const writable = this.getWritable();
        writable.__repoPath = repoPath;
    }

    override createDOM(): HTMLElement {
        try {
            const link = document.createElement('a');
            link.href = `https://github.com/${this.__repoPath}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('data-github-card', 'true');
            link.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; text-decoration: none; color: #24292f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s ease;';
            
            // Add GitHub icon SVG
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('height', '16');
            svg.setAttribute('width', '16');
            svg.setAttribute('viewBox', '0 0 16 16');
            svg.setAttribute('fill', 'currentColor');
            svg.style.cssText = 'flex-shrink: 0;';
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z');
            svg.appendChild(path);
            
            // Add repo path text
            const span = document.createElement('span');
            span.textContent = this.__repoPath;
            
            link.appendChild(svg);
            link.appendChild(span);
            
            // Add hover effects
            link.addEventListener('mouseenter', () => {
                link.style.background = '#eaeef2';
            });
            link.addEventListener('mouseleave', () => {
                link.style.background = '#f6f8fa';
            });
            
            return link;
        } catch (error) {
            console.error('[GitHubCardNode] createDOM failed:', error);
            // Return a fallback element
            const fallback = document.createElement('div');
            fallback.textContent = `GitHub: ${this.__repoPath}`;
            fallback.style.cssText = 'padding: 8px; background: #fee; border: 1px solid #fcc;';
            return fallback;
        }
    }

    override updateDOM(): false {
        return false;
    }

    static override importJSON(serializedNode: SerializedGitHubCardNode): GitHubCardNode {
        try {
            if (!serializedNode.repoPath) {
                console.error('[GitHubCardNode] Missing repoPath in serialized node');
                return $createGitHubCardNode('error/missing-repo-path');
            }
            
            const node = $createGitHubCardNode(serializedNode.repoPath);
            
            // Only set properties if they exist and are valid
            if (serializedNode.format !== undefined && serializedNode.format !== null) {
                node.setFormat(serializedNode.format);
            }
            if (serializedNode.indent !== undefined && serializedNode.indent !== null && serializedNode.indent > 0) {
                node.setIndent(serializedNode.indent);
            }
            if (serializedNode.direction && serializedNode.direction !== null) {
                node.setDirection(serializedNode.direction);
            }
            
            return node;
        } catch (error) {
            console.error('[GitHubCardNode] importJSON failed:', error, serializedNode);
            // Return a fallback node to prevent breaking the entire editor
            return $createGitHubCardNode(serializedNode.repoPath || 'error/loading');
        }
    }

    override exportJSON(): SerializedGitHubCardNode {
        return {
            ...super.exportJSON(),
            repoPath: this.getRepoPath(),
            type: 'github-card',
            version: 1
        };
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            div: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-lexical-github-card')) {
                    return null;
                }
                return {
                    conversion: convertGitHubCardElement,
                    priority: 1
                };
            }
        };
    }

    override exportDOM(): DOMExportOutput {
        const element = document.createElement('div');
        element.setAttribute('data-lexical-github-card', 'true');
        element.setAttribute('data-repo-path', this.__repoPath);
        
        const link = document.createElement('a');
        link.href = `https://github.com/${this.__repoPath}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = this.__repoPath;
        link.style.cssText = 'display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px;';
        
        element.appendChild(link);
        return { element };
    }

    // Block-level leaf node - cannot contain children
    override isInline(): boolean {
        return false;
    }

    override canBeEmpty(): boolean {
        return true;
    }

    override canInsertTextBefore(): boolean {
        return false;
    }

    override canInsertTextAfter(): boolean {
        return false;
    }

    override collapseAtStart(): boolean {
        return false;
    }
}

function convertGitHubCardElement(domNode: HTMLElement): DOMConversionOutput | null {
    const repoPath = domNode.getAttribute('data-repo-path');
    if (repoPath) {
        const node = $createGitHubCardNode(repoPath);
        return { node };
    }
    return null;
}

export function $createGitHubCardNode(repoPath: string): GitHubCardNode {
    return new GitHubCardNode(repoPath);
}

export function $isGitHubCardNode(
    node: LexicalNode | null | undefined
): node is GitHubCardNode {
    return node instanceof GitHubCardNode;
}
