import fs from 'fs';
import os from 'os';
import path from 'path';
import type { StoreWidgetPayload, WidgetData } from '../types';

export type WidgetCacheLogger = Pick<
  typeof console,
  'log' | 'warn' | 'error'
>;

export type WidgetCacheOptions = {
  /**
   * Absolute path to use as the cache directory. Overrides baseDir + namespace.
   */
  cacheDir?: string;
  /**
   * Namespace appended to the base cache directory. Defaults to `widget-kit`.
   */
  namespace?: string;
  /**
   * Parent directory that holds the namespace folder. Defaults to the OS temp directory.
   */
  baseDir?: string;
  /**
   * Maximum file age before removal, in milliseconds. Defaults to 30 minutes.
   */
  maxAgeMs?: number;
  /**
   * How often to run cleanup, in milliseconds. Defaults to 5 minutes.
   */
  cleanupIntervalMs?: number;
  /**
   * Optional logger for diagnostics. Defaults to `console`.
   */
  logger?: WidgetCacheLogger;
  /**
   * Optional custom ID factory. Defaults to a random base-36 string.
   */
  idFactory?: () => string;
};

export type WidgetCache<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
> = {
  cacheDir: string;
  storeWidget: (
    payload: StoreWidgetPayload<TToolOutput, TMetadata>
  ) => string;
  getWidget: (id: string) => WidgetData<TToolOutput, TMetadata> | null;
  cleanup: () => void;
};

const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const defaultIdFactory = () =>
  Math.random().toString(36).substring(2, 10) +
  Math.random().toString(36).substring(2, 10);

export function createFsWidgetCache<
  TToolOutput = unknown,
  TMetadata = StoreWidgetPayload<TToolOutput>['toolResponseMetadata']
>(options: WidgetCacheOptions = {}): WidgetCache<TToolOutput, TMetadata> {
  const {
    cacheDir: explicitCacheDir,
    namespace = 'widget-kit',
    baseDir = path.join(os.tmpdir(), 'widget-kit'),
    maxAgeMs = DEFAULT_MAX_AGE_MS,
    cleanupIntervalMs = DEFAULT_CLEANUP_INTERVAL_MS,
    logger = console,
    idFactory = defaultIdFactory,
  } = options;

  const cacheDir = explicitCacheDir ?? path.join(baseDir, namespace);

  ensureDirectory(cacheDir, logger);

  const cleanup = () => cleanupOldWidgets(cacheDir, maxAgeMs, logger);

  // Perform an initial cleanup to avoid unbounded growth after restarts.
  cleanup();

  if (cleanupIntervalMs > 0) {
    const timer = setInterval(cleanup, cleanupIntervalMs);
    // Prevent Node from keeping the process alive for the interval.
    timer.unref?.();
  }

  const storeWidget = (
    payload: StoreWidgetPayload<TToolOutput, TMetadata>
  ) => {
    const id = idFactory();
    const filePath = path.join(cacheDir, `${id}.json`);

    const record: WidgetData<TToolOutput, TMetadata> = {
      html: payload.html,
      toolOutput: payload.toolOutput,
      toolResponseMetadata: payload.toolResponseMetadata,
      timestamp: Date.now(),
    };

    fs.writeFileSync(filePath, JSON.stringify(record), 'utf-8');
    logger.log?.(
      `[widget-kit] Stored widget ${id} at ${filePath} (html length: ${record.html.length})`
    );

    return id;
  };

  const getWidget = (
    id: string
  ): WidgetData<TToolOutput, TMetadata> | null => {
    try {
      const filePath = path.join(cacheDir, `${id}.json`);
      if (!fs.existsSync(filePath)) {
        logger.warn?.(`[widget-kit] Widget ${id} not found at ${filePath}`);
        return null;
      }

      const contents = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(contents) as WidgetData<TToolOutput, TMetadata>;
    } catch (error) {
      logger.error?.(
        `[widget-kit] Failed to read widget ${id} from cache:`,
        error
      );
      return null;
    }
  };

  return {
    cacheDir,
    storeWidget,
    getWidget,
    cleanup,
  };
}

function ensureDirectory(cacheDir: string, logger: WidgetCacheLogger) {
  if (fs.existsSync(cacheDir)) {
    return;
  }

  fs.mkdirSync(cacheDir, { recursive: true });
  logger.log?.(`[widget-kit] Created cache directory at ${cacheDir}`);
}

function cleanupOldWidgets(
  cacheDir: string,
  maxAgeMs: number,
  logger: WidgetCacheLogger
) {
  try {
    const now = Date.now();
    const files = fs.readdirSync(cacheDir);
    let cleaned = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(cacheDir, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        cleaned += 1;
      }
    }

    if (cleaned > 0) {
      logger.log?.(`[widget-kit] Removed ${cleaned} stale widget(s)`);
    }
  } catch (error) {
    logger.error?.('[widget-kit] Failed to cleanup cache directory:', error);
  }
}
