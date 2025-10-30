export type WidgetMetaData = {
  'openai/outputTemplate'?: string;
  'openai/toolInvocation/invoking'?: string;
  'openai/toolInvocation/invoked'?: string;
  'openai/widgetAccessible'?: boolean;
  'openai/resultCanProduceWidget'?: boolean;
};

export type ResourceContent = {
  uri: string;
  text?: string;
  mimeType?: string;
};

export type MCPToolResult = {
  content: Array<{ type: string; text: string }>;
  structuredContent?: unknown;
  _meta?: WidgetMetaData;
};

export type MCPTool = {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
};