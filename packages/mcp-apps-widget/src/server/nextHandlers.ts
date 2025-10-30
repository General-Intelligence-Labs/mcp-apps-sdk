import { NextResponse, type NextRequest } from 'next/server';
import type { StoreWidgetPayload, WidgetData } from '../types';
import { type WidgetCache, type WidgetCacheLogger } from './widgetCache';

export type WidgetStoreHandlerOptions<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
> = {
  cache: WidgetCache<TToolOutput, TMetadata>;
  logger?: WidgetCacheLogger;
  validate?: (
    payload: StoreWidgetPayload<TToolOutput, TMetadata>
  ) => void | Promise<void>;
};

export type WidgetRenderHandlerOptions<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
> = {
  cache: WidgetCache<TToolOutput, TMetadata>;
  defaultHeight?: number | string;
  csp?: string;
  baseHref?: string;
  headers?: Record<string, string>;
  logger?: WidgetCacheLogger;
};

export type RenderWidgetHtmlOptions<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
> = {
  id: string;
  widget: WidgetData<TToolOutput, TMetadata>;
  defaultHeight?: number | string;
  baseHref?: string;
};

export const DEFAULT_WIDGET_CSP =
  "default-src 'self' https://persistent.oaistatic.com https://*.oaistatic.com; script-src 'unsafe-inline' 'unsafe-eval' https://persistent.oaistatic.com https://*.oaistatic.com; style-src 'unsafe-inline' https://persistent.oaistatic.com https://*.oaistatic.com; img-src 'self' data: https://persistent.oaistatic.com https://*.oaistatic.com; font-src 'self' https://persistent.oaistatic.com https://*.oaistatic.com; connect-src 'self' https://persistent.oaistatic.com https://*.oaistatic.com;";

const DEFAULT_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
} as const;

const resolveHeightValues = (value?: number | string) => {
  if (typeof value === 'number') {
    return {
      css: `${value}px`,
      numeric: value,
    };
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const numeric = Number.parseInt(value, 10);
    return {
      css: value,
      numeric: Number.isFinite(numeric) ? numeric : 0,
    };
  }

  return {
    css: '400px',
    numeric: 400,
  };
};

const escapeForHtml = (value: string) =>
  value
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

export function renderWidgetHtml<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
>({
  id,
  widget,
  defaultHeight,
  baseHref = '/',
}: RenderWidgetHtmlOptions<TToolOutput, TMetadata>) {
  const { numeric: numericHeight } = resolveHeightValues(defaultHeight);

  const safeToolOutput = escapeForHtml(
    JSON.stringify(widget.toolOutput ?? null)
  );
  const safeMetadata = escapeForHtml(
    JSON.stringify(widget.toolResponseMetadata ?? null)
  );

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <base href="${baseHref}">
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
        maxHeight: ${numericHeight},
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
  ${widget.html}
</body>
</html>`;
}

export function createWidgetStoreHandler<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
>({
  cache,
  logger = console,
  validate,
}: WidgetStoreHandlerOptions<TToolOutput, TMetadata>) {
  return async function handler(request: NextRequest) {
    try {
      const payload =
        (await request.json()) as StoreWidgetPayload<TToolOutput, TMetadata>;

      if (!payload?.html || typeof payload.html !== 'string') {
        return NextResponse.json({ error: 'Missing html' }, { status: 400 });
      }

      if (validate) {
        await validate(payload);
      }

      const id = cache.storeWidget({
        html: payload.html,
        toolOutput: payload.toolOutput,
        toolResponseMetadata: payload.toolResponseMetadata,
      });

      return NextResponse.json({ id });
    } catch (error) {
      logger.error?.('[widget-kit] Failed to store widget:', error);
      return NextResponse.json(
        { error: 'Failed to store widget' },
        { status: 500 }
      );
    }
  };
}

type RouteParams = { id: string };

const resolveParams = async (
  params?: RouteParams | Promise<RouteParams>
): Promise<RouteParams | undefined> => {
  if (!params) {
    return undefined;
  }

  if (typeof (params as Promise<RouteParams>).then === 'function') {
    return params;
  }

  return params as RouteParams;
};

export function createWidgetRenderHandler<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
>({
  cache,
  defaultHeight,
  csp = DEFAULT_WIDGET_CSP,
  baseHref,
  headers,
  logger = console,
}: WidgetRenderHandlerOptions<TToolOutput, TMetadata>) {
  return async function handler(
    _request: NextRequest,
    context: { params?: RouteParams | Promise<RouteParams> }
  ) {
    try {
      const params = await resolveParams(context?.params);
      const id = params?.id;

      if (!id) {
        logger.warn?.('[widget-kit] Widget request missing id parameter');
        return new NextResponse('Missing widget id', { status: 400 });
      }

      const widget = cache.getWidget(id);

      if (!widget) {
        logger.warn?.(`[widget-kit] Widget not found for id: ${id}`);
        return new NextResponse('Widget not found or expired', {
          status: 404,
        });
      }

      const html = renderWidgetHtml({
        id,
        widget,
        defaultHeight,
        baseHref,
      });

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...DEFAULT_HEADERS,
          ...headers,
          ...(csp ? { 'Content-Security-Policy': csp } : {}),
        },
      });
    } catch (error) {
      logger.error?.('[widget-kit] Failed to render widget:', error);
      return new NextResponse('Failed to render widget', {
        status: 500,
      });
    }
  };
}
