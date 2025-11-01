# @xalia/mcp-apps-widget

React components and utilities for rendering MCP app widgets in secure iframes.

## Installation

```bash
npm install @xalia/mcp-apps-widget
# or
pnpm add @xalia/mcp-apps-widget
```

## Usage

### Client-side Component

```tsx
import { AssistantAppEmbed } from '@xalia/mcp-apps-widget';

function MyApp() {
  const widgetHtml = '<html>...</html>';
  const toolOutput = { /* tool execution result */ };
  const metadata = { 'openai/widgetAccessible': true };

  return (
    <AssistantAppEmbed
      widgetHtml={widgetHtml}
      toolOutput={toolOutput}
      metadata={metadata}
      inlineHeight="400px"
    />
  );
}
```

### Server-side Handlers (Next.js)

```typescript
// app/api/widget/store/route.ts
import { createWidgetStoreHandler } from '@xalia/mcp-apps-widget/server';

export const POST = createWidgetStoreHandler();

// app/api/widget/[id]/route.ts
import { createWidgetRenderHandler } from '@xalia/mcp-apps-widget/server';

export const GET = createWidgetRenderHandler();
```

## Features

- Secure iframe sandboxing
- PostMessage communication protocol
- Widget state management
- Display mode switching (inline/fullscreen)
- Server-side rendering support

## License

MIT