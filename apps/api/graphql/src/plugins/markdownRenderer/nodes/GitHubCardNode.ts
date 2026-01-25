/**
 * Server-side GitHubCardNode for headless Lexical editor
 * 
 * This is a simplified version without DOM dependencies.
 * Only needs serialization/deserialization for markdown conversion.
 * 
 * Uses DecoratorNode on client, but ElementNode here for compatibility
 * with headless editor (DecoratorNode requires React on client).
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
        // Handle both old and new serialization formats
        const repoPath = serializedNode.repoPath || 'unknown/repo';
        return $createGitHubCardNode(repoPath);
    }

    override exportJSON(): SerializedGitHubCardNode {
        return {
            ...super.exportJSON(),
            type: 'github-card',
            version: 1,
            repoPath: this.__repoPath,
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
