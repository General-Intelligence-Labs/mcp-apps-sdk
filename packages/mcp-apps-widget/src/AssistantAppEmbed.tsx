'use client';

import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  StoreWidgetPayload,
  StoreWidgetResult,
  WidgetMetaData,
} from './types';
export type {
  StoreWidgetPayload,
  StoreWidgetResult,
  WidgetMetaData,
} from './types';

type DisplayMode = 'inline' | 'fullscreen';

export type StoreWidgetFn<TToolOutput> = (
  payload: StoreWidgetPayload<TToolOutput, WidgetMetaData>
) => Promise<StoreWidgetResult | void>;

export type DisplayModeRequestContext = {
  requestedMode: string;
  requestId?: number;
  currentMode: DisplayMode;
  allowMode: (mode: DisplayMode) => void;
  deny: () => void;
  postMessage: (message: Record<string, unknown>) => void;
};

export type DisplayModeRequestHandler = (
  context: DisplayModeRequestContext
) => boolean | void;

export type AssistantAppEmbedProps<TToolOutput = unknown> = {
  html: string;
  toolOutput?: TToolOutput;
  toolResponseMetadata: WidgetMetaData;
  storeWidget?: StoreWidgetFn<TToolOutput>;
  storeWidgetPath?: string;
  createWidgetSrc?: (widgetId: string) => string;
  onDisplayModeRequest?: DisplayModeRequestHandler;
  onOpenExternal?: (href: string) => void;
  loadingFallback?: ReactNode;
  inlineHeight?: number | string;
  className?: string;
  fullscreenClassName?: string;
};

const DEFAULT_INLINE_HEIGHT = '400px';

const isDisplayMode = (value: string): value is DisplayMode =>
  value === 'inline' || value === 'fullscreen';

const defaultCreateWidgetSrc = (widgetId: string) => `/api/widget/${widgetId}`;

const buildDefaultStoreWidget =
  <TToolOutput,>(path: string): StoreWidgetFn<TToolOutput> =>
  async ({ html, toolOutput, toolResponseMetadata }) => {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        toolOutput,
        toolResponseMetadata,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `[AssistantAppEmbed] Failed to store widget. Status: ${response.status}`
      );
    }

    const data = await response.json();
    return { id: data?.id };
  };

export default function AssistantAppEmbed<TToolOutput>({
  html,
  toolOutput,
  toolResponseMetadata,
  storeWidget,
  storeWidgetPath = '/api/widget/store',
  createWidgetSrc,
  onDisplayModeRequest,
  onOpenExternal,
  loadingFallback,
  inlineHeight = DEFAULT_INLINE_HEIGHT,
  className,
  fullscreenClassName,
}: AssistantAppEmbedProps<TToolOutput>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('inline');

  const templateUri = toolResponseMetadata['openai/outputTemplate'];
  const inlineHeightValue =
    typeof inlineHeight === 'number' ? `${inlineHeight}px` : inlineHeight;

  const widgetSrcFactory = useMemo(
    () => createWidgetSrc ?? defaultCreateWidgetSrc,
    [createWidgetSrc]
  );

  const storeWidgetFn = useMemo(() => {
    if (storeWidget) {
      return storeWidget;
    }

    return buildDefaultStoreWidget<TToolOutput>(storeWidgetPath);
  }, [storeWidget, storeWidgetPath]);

  useEffect(() => {
    let isActive = true;

    const persistWidget = async () => {
      try {
        const result = await storeWidgetFn({
          html,
          toolOutput,
          toolResponseMetadata,
        });

        if (!isActive) {
          return;
        }

        if (result?.src) {
          setIframeSrc(result.src);
        } else if (result?.id) {
          setIframeSrc(widgetSrcFactory(result.id));
        }
      } catch (error) {
        console.error('[AssistantAppEmbed] Failed to store widget:', error);
      }
    };

    persistWidget();

    return () => {
      isActive = false;
    };
  }, [html, toolOutput, toolResponseMetadata, storeWidgetFn, widgetSrcFactory]);

  const postToIframe = useCallback((message: Record<string, unknown>) => {
    const target = iframeRef.current?.contentWindow;
    if (target) {
      target.postMessage(message, '*');
    }
  }, []);

  const handleDisplayModeRequest = useCallback(
    (requestedMode: string, requestId?: number) => {
      const allowMode = (mode: DisplayMode) => {
        setDisplayMode(mode);

        if (typeof requestId === 'number') {
          postToIframe({
            type: 'openai-display-mode-result',
            requestId,
            mode,
            granted: true,
          });
        }

        postToIframe({
          type: 'openai-display-mode-update',
          mode,
        });
      };

      const deny = () => {
        if (typeof requestId === 'number') {
          postToIframe({
            type: 'openai-display-mode-result',
            requestId,
            mode: displayMode,
            granted: false,
          });
        }
      };

      const handled = onDisplayModeRequest?.({
        requestedMode,
        requestId,
        currentMode: displayMode,
        allowMode,
        deny,
        postMessage: postToIframe,
      });

      if (handled) {
        return;
      }

      if (isDisplayMode(requestedMode)) {
        allowMode(requestedMode);
        return;
      }

      deny();
    },
    [displayMode, onDisplayModeRequest, postToIframe]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const payload = event.data || {};

      switch (payload.type) {
        case 'openai-open-external':
          if (typeof payload.href === 'string') {
            if (onOpenExternal) {
              onOpenExternal(payload.href);
            } else {
              window.open(payload.href, '_blank', 'noopener');
            }
          }
          break;
        case 'openai-request-display-mode':
          handleDisplayModeRequest(payload.mode, payload.requestId);
          break;
        case 'openai-display-mode-update':
          if (isDisplayMode(payload.mode)) {
            setDisplayMode(payload.mode);
          }
          break;
        case 'openai-widget-debug': {
          const eventMessage = payload.event ?? payload;
          const level =
            eventMessage.level === 'error'
              ? 'error'
              : eventMessage.level === 'warn'
                ? 'warn'
                : 'log';
          (console[level] ?? console.log).call(
            console,
            '[AssistantAppEmbed] Widget message:',
            eventMessage
          );
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleDisplayModeRequest, onOpenExternal]);

  const handleIframeLoad = useCallback(() => {
    postToIframe({
      type: 'openai-display-mode-update',
      mode: displayMode,
    });
  }, [displayMode, postToIframe]);

  const handleExitFullscreen = useCallback(() => {
    setDisplayMode('inline');
    postToIframe({
      type: 'openai-display-mode-update',
      mode: 'inline',
    });
  }, [postToIframe]);

  const isFullscreen = displayMode === 'fullscreen';

  if (!iframeSrc) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }

    return (
      <div className={className ?? 'my-2'}>
        <div
          className="overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          style={{ minHeight: inlineHeightValue }}
        >
          <div
            className="flex items-center justify-center"
            style={{ height: inlineHeightValue }}
          >
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading widget...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? fullscreenClassName ??
            'fixed inset-0 z-50 m-0 bg-white dark:bg-zinc-900'
          : className ?? 'my-2'
      }
    >
      {isFullscreen && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-end gap-2 bg-gradient-to-b from-white/80 dark:from-zinc-900/80 to-transparent px-4 py-3">
          <button
            type="button"
            onClick={handleExitFullscreen}
            className="rounded-full border border-zinc-300 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-sm backdrop-blur"
          >
            Exit fullscreen
          </button>
        </div>
      )}
      <div
        className={`overflow-hidden bg-white dark:bg-zinc-900 shadow-sm ${
          isFullscreen
            ? 'h-full w-full rounded-none border-0'
            : 'rounded-2xl border border-zinc-300 dark:border-zinc-800'
        }`}
        style={{
          minHeight: isFullscreen ? undefined : inlineHeightValue,
          height: isFullscreen ? '100%' : undefined,
        }}
      >
        <iframe
          ref={iframeRef}
          title={templateUri}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          src={iframeSrc}
          onLoad={handleIframeLoad}
          style={{
            width: '100%',
            height: isFullscreen ? '100%' : inlineHeightValue,
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}
