import { createWidgetRenderHandler } from '@xalia/mcp-apps-widget/server';
import { widgetCache } from '@/lib/widgetCache';
import { DEFAULT_WIDGET_HEIGHT } from '@/lib/widgetConstants';

// Development CSP that allows localhost resources
const DEVELOPMENT_CSP = process.env.NODE_ENV === 'development'
  ? "default-src 'self' http://localhost:* https://persistent.oaistatic.com https://*.oaistatic.com; " +
    "script-src 'unsafe-inline' 'unsafe-eval' http://localhost:* https://persistent.oaistatic.com https://*.oaistatic.com; " +
    "style-src 'unsafe-inline' http://localhost:* https://persistent.oaistatic.com https://*.oaistatic.com; " +
    "img-src 'self' data: http://localhost:* https://persistent.oaistatic.com https://*.oaistatic.com; " +
    "font-src 'self' http://localhost:* https://persistent.oaistatic.com https://*.oaistatic.com; " +
    "connect-src 'self' http://localhost:* https://persistent.oaistatic.com https://*.oaistatic.com;"
  : undefined;

export const GET = createWidgetRenderHandler({
  cache: widgetCache,
  defaultHeight: DEFAULT_WIDGET_HEIGHT,
  csp: DEVELOPMENT_CSP,
});
