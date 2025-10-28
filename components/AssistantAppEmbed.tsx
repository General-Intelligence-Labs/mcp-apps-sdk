'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_WIDGET_HEIGHT } from '@/lib/widgetConstants';

type WidgetMetaData = {
  'openai/outputTemplate'?: string;
  'openai/toolInvocation/invoking'?: string;
  'openai/toolInvocation/invoked'?: string;
  'openai/widgetAccessible'?: boolean;
  'openai/resultCanProduceWidget'?: boolean;
};

type AssistantAppEmbedProps = {
  html: string;
  toolOutput?: unknown;
  toolResponseMetadata: WidgetMetaData;
};

export default function AssistantAppEmbed({
  html,
  toolOutput,
  toolResponseMetadata,
}: AssistantAppEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'inline' | 'fullscreen'>(
    'inline'
  );

  const templateUri = toolResponseMetadata['openai/outputTemplate'];

  useEffect(() => {
    const storeWidget = async () => {
      try {
        const response = await fetch('/api/widget/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html,
            toolOutput,
            toolResponseMetadata,
          }),
        });

        const data = await response.json();
        if (data.id) {
          setIframeSrc(`/api/widget/${data.id}`);
        }
      } catch (error) {
        console.error('[AssistantAppEmbed] Failed to store widget:', error);
      }
    };

    storeWidget();
  }, [html, toolOutput, toolResponseMetadata]);

  const postToIframe = useCallback((message: Record<string, unknown>) => {
    const target = iframeRef.current?.contentWindow;
    if (target) {
      target.postMessage(message, '*');
    }
  }, []);

  const handleDisplayModeRequest = useCallback(
    (requestedMode: string, requestId?: number) => {
      const isValid =
        requestedMode === 'fullscreen' || requestedMode === 'inline';
      const mode = isValid ? requestedMode : displayMode;

      if (isValid) {
        setDisplayMode(mode as 'inline' | 'fullscreen');
      }

      if (typeof requestId === 'number') {
        postToIframe({
          type: 'openai-display-mode-result',
          requestId,
          mode,
          granted: isValid,
        });
      }

      if (isValid) {
        postToIframe({
          type: 'openai-display-mode-update',
          mode,
        });
      }
    },
    [displayMode, postToIframe]
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
            window.open(payload.href, '_blank', 'noopener');
          }
          break;
        case 'openai-request-display-mode':
          handleDisplayModeRequest(payload.mode, payload.requestId);
          break;
        case 'openai-display-mode-update':
          if (payload.mode === 'inline' || payload.mode === 'fullscreen') {
            setDisplayMode(payload.mode);
          }
          break;
        case 'openai-widget-debug': {
          const event = payload.event ?? payload;
          const level =
            event.level === 'error'
              ? 'error'
              : event.level === 'warn'
                ? 'warn'
                : 'log';
          (console[level] ?? console.log).call(console, '[AssistantAppEmbed] Widget message:', event);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleDisplayModeRequest]);

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
    return (
      <div className="my-2">
        <div
          className="overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          style={{ minHeight: DEFAULT_WIDGET_HEIGHT }}
        >
          <div
            className="flex items-center justify-center"
            style={{ height: DEFAULT_WIDGET_HEIGHT }}
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
      className={isFullscreen ? 'fixed inset-0 z-50 m-0 bg-white dark:bg-zinc-900' : 'my-2'}
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
          minHeight: isFullscreen ? undefined : DEFAULT_WIDGET_HEIGHT,
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
            height: isFullscreen ? '100%' : DEFAULT_WIDGET_HEIGHT,
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}

