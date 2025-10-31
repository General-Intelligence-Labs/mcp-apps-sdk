import type { MCPTool, MCPToolResult, WidgetMetaData } from '@xalia/mcp-client';

export type MCPToolWithWidget = MCPTool & {
  widgetMetadata?: WidgetMetaData;
};

export type MCPToolExecutor<TArgs = any> = (
  args: TArgs
) => Promise<MCPToolResult>;

export type ToolAdapter<TFrameworkTool> = {
  convertTool(mcpTool: MCPTool, executor: MCPToolExecutor): TFrameworkTool;
  convertResult(mcpResult: MCPToolResult): any;
};