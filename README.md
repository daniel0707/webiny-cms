# Webiny CMS with Markdown Support

This project is built on the [Webiny CMS](https://www.webiny.com/) starter template, enhanced with custom markdown editing capabilities and remark-based features.

## Overview

This is a headless CMS implementation using Webiny v5.43.5, with significant customizations to the rich text editor and content export system to support markdown workflows.

## Key Customizations

### Markdown-Enabled Rich Text Editor

The Lexical-based rich text editor has been extended to support:

- **Manual Markdown Toggle**: Switch between rich text and markdown editing modes via toolbar button
- **Remark Directive Syntax**: Support for extended markdown features using remark directives
- **Custom Block Types**:
  - Admonitions (callouts/alerts) using `:::admonition` container directives
  - Character chat bubbles using `:::character-chat` container directives
  - GitHub repository cards using `::github{repo="user/repo"}` leaf directives

### GraphQL API Enhancements

The GraphQL API has been extended to support markdown export:

- Content entries can be exported in markdown format
- Custom transformers convert Lexical JSON to markdown with remark directives
- Bidirectional conversion maintains content fidelity

## Project Structure

```
apps/
  admin/              # Admin UI with custom Lexical editor
    src/
      plugins/
        lexical/      # Custom nodes, transformers, and plugins
  api/
    graphql/          # GraphQL API with markdown rendering
      src/
        plugins/
          markdownRenderer/  # Markdown export transformers
extensions/
  theme/              # Custom styling
```

## Custom Lexical Nodes

### AdmonitionNode
Container directive for callouts/alerts with customizable types (note, tip, warning, danger, info).

### CharacterChatNode
Container directive for character dialogue bubbles with emoji support.

### GitHubCardNode
Leaf directive for displaying GitHub repository links as styled cards.

## Markdown Transformers

Custom transformers handle conversion between Lexical's internal JSON format and markdown with remark directives:

- **Frontend**: `apps/admin/src/plugins/lexical/customTransformers.ts`
- **Backend**: `apps/api/graphql/src/plugins/markdownRenderer/customTransformers.ts`

## Development

```bash
# Install dependencies
yarn install

# Deploy to development environment
yarn webiny deploy --env=dev

# Deploy admin app only
yarn webiny deploy admin --env=dev

# Deploy API only
yarn webiny deploy api --env=dev
```

## Environment Setup

Copy `.example.env` to `.env` and configure:

```bash
AWS_REGION=your-region
WEBINY_PULUMI_BACKEND=your-pulumi-backend
PULUMI_ACCESS_TOKEN=your-token
AWS_PROFILE=your-profile
DEBUG=true
```

## Technologies

- **Webiny CMS**: v5.43.5
- **Lexical**: Facebook's extensible text editor framework
- **Remark**: Markdown processor with directive support
- **AWS**: Infrastructure deployment via Pulumi
- **GraphQL**: Content API

## License

Based on Webiny CMS starter template. See [Webiny License](https://github.com/webiny/webiny-js/blob/master/LICENSE).
