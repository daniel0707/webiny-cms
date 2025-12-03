/**
 * Server-side GitHubCardNode for headless Lexical editor
 * 
 * This is a simplified version without DOM dependencies.
 * Only needs serialization/deserialization for markdown conversion.
 */

import type {
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

    // Server-side: minimal DOM creation (jsdom will provide document)
    override createDOM(): HTMLElement {
        const dom = document.createElement('div');
        dom.className = 'github-card';
        return dom;
    }

    override updateDOM(): false {
        return false;
    }

    static override importJSON(serializedNode: SerializedGitHubCardNode): GitHubCardNode {
        const node = $createGitHubCardNode(serializedNode.repoPath);
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    override exportJSON(): SerializedGitHubCardNode {
        return {
            ...super.exportJSON(),
            repoPath: this.getRepoPath(),
            type: 'github-card',
            version: 1
        };
    }
}

export function $createGitHubCardNode(repoPath: string): GitHubCardNode {
    return new GitHubCardNode(repoPath);
}

export function $isGitHubCardNode(
    node: LexicalNode | null | undefined
): node is GitHubCardNode {
    return node instanceof GitHubCardNode;
}
