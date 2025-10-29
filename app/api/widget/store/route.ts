import { createWidgetStoreHandler } from '@/packages/widget-kit/src/server';
import { widgetCache } from '@/lib/widgetCache';

export const POST = createWidgetStoreHandler({
  cache: widgetCache,
});

