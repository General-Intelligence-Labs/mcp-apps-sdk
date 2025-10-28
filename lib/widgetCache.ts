import fs from 'fs';
import path from 'path';
import os from 'os';

export interface WidgetData {
  html: string;
  toolOutput: unknown;
  toolResponseMetadata: Record<string, unknown> | null;
  timestamp: number;
}

const CACHE_DIR = path.join(os.tmpdir(), 'my-ai-app-widgets');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  console.log('[widgetCache] Created cache directory:', CACHE_DIR);
}

cleanupOldWidgets();

function cleanupOldWidgets() {
  try {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    const files = fs.readdirSync(CACHE_DIR);
    let cleaned = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[widgetCache] Cleaned up ${cleaned} old widget(s)`);
    }
  } catch (error) {
    console.error('[widgetCache] Error during cleanup:', error);
  }
}

setInterval(cleanupOldWidgets, 5 * 60 * 1000);

export function storeWidget(
  html: string,
  toolOutput: unknown,
  toolResponseMetadata: Record<string, unknown> | null
): string {
  const id = Math.random().toString(36).substring(2, 15);
  const data: WidgetData = {
    html,
    toolOutput,
    toolResponseMetadata,
    timestamp: Date.now(),
  };

  const filePath = path.join(CACHE_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');

  console.log(`[widgetCache] Stored widget ${id} at ${filePath}`);
  return id;
}

export function getWidget(id: string): WidgetData | null {
  try {
    const filePath = path.join(CACHE_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`[widgetCache] Widget ${id} NOT FOUND at ${filePath}`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as WidgetData;
    console.log(
      `[widgetCache] Retrieved widget ${id}, html length: ${data.html.length}`
    );
    return data;
  } catch (error) {
    console.error(`[widgetCache] Error retrieving widget ${id}:`, error);
    return null;
  }
}

