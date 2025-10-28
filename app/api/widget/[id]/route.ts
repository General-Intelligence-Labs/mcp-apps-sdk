import { NextRequest, NextResponse } from 'next/server';
import { getWidget, type WidgetData } from '@/lib/widgetCache';
import { DEFAULT_WIDGET_HEIGHT } from '@/lib/widgetConstants';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log('[API /widget/[id]] Fetching widget:', id);

  const widgetData: WidgetData | null = getWidget(id);

  if (!widgetData) {
    console.error('[API /widget/[id]] Widget not found:', id);
    return new NextResponse('Widget not found or expired', { status: 404 });
  }

  console.log(
    '[API /widget/[id]] Widget found, html length:',
    widgetData.html.length
  );

  const { html, toolOutput, toolResponseMetadata }: WidgetData = widgetData;

  const safeToolOutput: string = JSON.stringify(toolOutput)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  const safeMetadata: string = JSON.stringify(toolResponseMetadata)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  const fullHtml: string = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html,body{margin:0;padding:0;height:100%;width:100%;background:transparent;}
  </style>
  <script>
    (function() {
      console.log('[Widget] Initialization starting...');
      const widgetId = '${id}';

      try {
        if (window.history?.replaceState) {
          window.history.replaceState(null, '', '/');
        }
      } catch (error) {
        console.warn('[Widget] Failed to reset history state', error);
      }

      const sanitize = (value) => {
        try {
          if (typeof value === 'object' && value !== null) {
            return JSON.parse(JSON.stringify(value));
          }
        } catch (_) {}
        if (value instanceof Error) {
          return { message: value.message, stack: value.stack };
        }
        return typeof value === 'string' ? value : String(value);
      };

      const notifyParent = (payload) => {
        const serialized = sanitize(payload);
        if (window.parent) {
          window.parent.postMessage(
            { type: 'openai-widget-debug', event: serialized },
            '*'
          );
        }
        try {
          navigator.sendBeacon('/api/widget/log', JSON.stringify({ id: widgetId, event: serialized }));
        } catch (err) {
          fetch('/api/widget/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: widgetId, event: serialized }),
            keepalive: true,
          }).catch(() => {});
        }
      };

      const patchConsole = () => {
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalLog = console.log;

        console.error = (...args) => {
          notifyParent({ level: 'error', args });
          originalError.apply(console, args);
        };

        console.warn = (...args) => {
          notifyParent({ level: 'warn', args });
          originalWarn.apply(console, args);
        };

        console.log = (...args) => {
          notifyParent({ level: 'log', args });
          originalLog.apply(console, args);
        };
      };

      patchConsole();

      window.addEventListener('error', (event) => {
        notifyParent({
          level: 'error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        notifyParent({
          level: 'error',
          message: String(event.reason),
          stack: event.reason?.stack,
        });
      });
      
      const sharedGlobals = {
        theme: 'light',
        locale: 'en-US',
        userAgent: {
          device: { type: 'desktop' },
          capabilities: { hover: true, touch: false }
        },
        maxHeight: ${DEFAULT_WIDGET_HEIGHT.replace('px', '')},
        displayMode: 'inline',
        safeArea: { insets: { top: 0, right: 0, bottom: 0, left: 0 } },
        toolInput: null,
        toolOutput: ${safeToolOutput},
        toolResponseMetadata: ${safeMetadata},
        widgetState: null
      };
      
      let displayModeRequestCounter = 0;
      const pendingDisplayModeRequests = new Map();
      
      const dispatchGlobals = (globals) => {
        const detail = { globals };
        window.dispatchEvent(new CustomEvent('openai:set_globals', { detail }));
        window.dispatchEvent(new CustomEvent('webplus:set_globals', { detail }));
        notifyParent({ level: 'log', source: 'widget', event: 'set_globals', globals });
      };
      
      const updateGlobalNamespaces = (updates) => {
        if (window.openai) {
          Object.assign(window.openai, updates);
        }
        if (window.webplus) {
          Object.assign(window.webplus, updates);
        }
      };
      
      const updateWidgetState = (nextState) => {
        const current = sharedGlobals.widgetState;
        const resolved = typeof nextState === 'function' ? nextState(current) : nextState;
        sharedGlobals.widgetState = resolved;
        updateGlobalNamespaces({ widgetState: resolved });
        if (window.parent) {
          window.parent.postMessage({ type: 'openai-widget-state', state: resolved }, '*');
        }
        dispatchGlobals({ widgetState: resolved });
        return resolved;
      };
      
      const unsupported = (name) => () => Promise.reject(new Error(name + ' is not supported'));
      const setDisplayMode = (mode) => {
        if (!mode || sharedGlobals.displayMode === mode) {
          return;
        }
        sharedGlobals.displayMode = mode;
        updateGlobalNamespaces({ displayMode: mode });
        dispatchGlobals({ displayMode: mode });
      };
      
      const openExternal = ({ href }) => {
        if (href && window.parent) {
          window.parent.postMessage({ type: 'openai-open-external', href }, '*');
        }
      };
      
      const requestDisplayModeFromParent = async ({ mode }) => {
        const desiredMode = mode ?? sharedGlobals.displayMode;
        if (!window.parent) {
          setDisplayMode(desiredMode);
          return { mode: desiredMode, granted: true };
        }
        const requestId = ++displayModeRequestCounter;
        return new Promise((resolve) => {
          pendingDisplayModeRequests.set(requestId, (result) => {
            if (result?.mode) {
              setDisplayMode(result.mode);
            }
            resolve({
              mode: result?.mode ?? sharedGlobals.displayMode,
              granted: Boolean(result?.granted)
            });
          });
          window.parent.postMessage(
            { type: 'openai-request-display-mode', mode: desiredMode, requestId },
            '*'
          );
        });
      };
      
      window.addEventListener('message', (event) => {
        const payload = event?.data;
        if (!payload || typeof payload !== 'object') {
          return;
        }
        switch (payload.type) {
          case 'openai-display-mode-result': {
            const resolver = pendingDisplayModeRequests.get(payload.requestId);
            if (resolver) {
              pendingDisplayModeRequests.delete(payload.requestId);
              resolver({ mode: payload.mode, granted: payload.granted });
            }
            break;
          }
          case 'openai-display-mode-update': {
            if (payload.mode) {
              setDisplayMode(payload.mode);
            }
            break;
          }
          default:
            break;
        }
      });
      
      const createApi = (requestDisplayMode) => ({
        ...sharedGlobals,
        async setWidgetState(nextState) {
          updateWidgetState(nextState);
        },
        callTool: unsupported('callTool'),
        sendFollowUpMessage: unsupported('sendFollowUpMessage'),
        openExternal,
        requestDisplayMode
      });
      
      window.openai = createApi(requestDisplayModeFromParent);
      window.webplus = createApi(requestDisplayModeFromParent);
      
      window.oai = {
        widget: {
          setState: (state) => { updateWidgetState(state); },
          getState: () => sharedGlobals.widgetState
        }
      };
      
      dispatchGlobals({
        theme: sharedGlobals.theme,
        locale: sharedGlobals.locale,
        userAgent: sharedGlobals.userAgent,
        maxHeight: sharedGlobals.maxHeight,
        displayMode: sharedGlobals.displayMode,
        safeArea: sharedGlobals.safeArea,
        toolInput: sharedGlobals.toolInput,
        toolOutput: sharedGlobals.toolOutput,
        toolResponseMetadata: sharedGlobals.toolResponseMetadata,
        widgetState: sharedGlobals.widgetState
      });
      
      console.log('[Widget] window globals initialized with data:', {
        toolOutput: sharedGlobals.toolOutput,
        hasData: !!sharedGlobals.toolOutput
      });
    })();
  </script>
</head>
<body>
  ${html}
</body>
</html>`;

  return new NextResponse(fullHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy':
        "default-src 'self' https://persistent.oaistatic.com https://*.oaistatic.com; script-src 'unsafe-inline' 'unsafe-eval' https://persistent.oaistatic.com https://*.oaistatic.com; style-src 'unsafe-inline' https://persistent.oaistatic.com https://*.oaistatic.com; img-src 'self' data: https://persistent.oaistatic.com https://*.oaistatic.com; font-src 'self' https://persistent.oaistatic.com https://*.oaistatic.com; connect-src 'self' https://persistent.oaistatic.com https://*.oaistatic.com;",
    },
  });
}
