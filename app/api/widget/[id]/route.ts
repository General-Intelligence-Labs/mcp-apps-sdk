import { createWidgetRenderHandler } from '@/packages/widget-kit/src/server';
import { widgetCache } from '@/lib/widgetCache';
import { DEFAULT_WIDGET_HEIGHT } from '@/lib/widgetConstants';

export const GET = createWidgetRenderHandler({
  cache: widgetCache,
  defaultHeight: DEFAULT_WIDGET_HEIGHT,
});
