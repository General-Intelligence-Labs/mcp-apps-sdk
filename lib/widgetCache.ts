import os from 'os';
import path from 'path';
import { createFsWidgetCache } from '../packages/widget-kit/src/server';
import type { WidgetData } from '../packages/widget-kit/src/types';

const widgetCache = createFsWidgetCache({
  cacheDir: path.join(os.tmpdir(), 'my-ai-app-widgets'),
});

export const { storeWidget, getWidget, cleanup: cleanupWidgetCache } =
  widgetCache;

export { widgetCache };
export type { WidgetData };
