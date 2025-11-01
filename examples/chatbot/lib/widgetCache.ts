import os from 'os';
import path from 'path';
import { createFsWidgetCache } from '@xalia/mcp-apps-widget/server';
import type { WidgetData } from '@xalia/mcp-apps-widget';

const widgetCache = createFsWidgetCache({
  cacheDir: path.join(os.tmpdir(), 'my-ai-app-widgets'),
});

export const { storeWidget, getWidget, cleanup: cleanupWidgetCache } =
  widgetCache;

export { widgetCache };
export type { WidgetData };
