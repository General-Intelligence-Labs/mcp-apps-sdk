import { createWidgetStoreHandler } from '@xalia/mcp-apps-widget/server';
import { widgetCache } from '@/lib/widgetCache';

export const POST = createWidgetStoreHandler({
  cache: widgetCache,
});

