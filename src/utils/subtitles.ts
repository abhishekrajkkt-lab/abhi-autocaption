import { CaptionItem } from '../types';

/**
 * Format seconds to MM:SS or MM:SS.ms
 */
export function formatTime(seconds: number, withDecimals: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (withDecimals) {
    return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
  }
  return `${mins}:${Math.floor(secs).toString().padStart(2, '0')}`;
}

/**
 * Format seconds into SRT timestamp 00:00:00,000
 */
export function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Format seconds into VTT timestamp 00:00:00.000
 */
export function formatVttTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Parse SRT text into CaptionItem[]
 */
export function parseSrt(srtContent: string): CaptionItem[] {
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);
  const items: CaptionItem[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].trim().split('\n');
    if (lines.length < 2) continue;

    // Time line is usually index 1 (or index 0 if numbering is omitted)
    const timeLineIndex = lines[0].includes('-->') ? 0 : 1;
    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const start = parseTimestampToSeconds(startStr);
    const end = parseTimestampToSeconds(endStr);

    const textLines = lines.slice(timeLineIndex + 1).join(' ');
    const text = textLines.replace(/<[^>]+>/g, '').trim();

    if (text) {
      items.push({
        id: `srt_${Date.now()}_${i}`,
        text,
        start: Number(start.toFixed(2)),
        end: Number(end.toFixed(2)),
      });
    }
  }

  return items;
}

function parseTimestampToSeconds(timestamp: string): number {
  const clean = timestamp.replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(clean) || 0;
}

/**
 * Export captions as SRT file content
 */
export function exportToSrt(captions: CaptionItem[]): string {
  return captions
    .map((cap, index) => {
      const idx = index + 1;
      const timecode = `${formatSrtTimestamp(cap.start)} --> ${formatSrtTimestamp(cap.end)}`;
      const text = cap.emoji ? `${cap.text} ${cap.emoji}` : cap.text;
      return `${idx}\n${timecode}\n${text}\n`;
    })
    .join('\n');
}

/**
 * Export captions as WebVTT file content
 */
export function exportToVtt(captions: CaptionItem[]): string {
  const header = 'WEBVTT - Exported with Reeltype Studio\n\n';
  const body = captions
    .map((cap, index) => {
      const idx = index + 1;
      const timecode = `${formatVttTimestamp(cap.start)} --> ${formatVttTimestamp(cap.end)}`;
      const text = cap.emoji ? `${cap.text} ${cap.emoji}` : cap.text;
      return `${idx}\n${timecode}\n${text}\n`;
    })
    .join('\n');
  return header + body;
}

/**
 * Download file directly to user's computer
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Smart Script Chunker & Auto-Aligner
 * Splits text into N words per chunk and calculates timestamps evenly or scaled to duration
 */
export function splitScriptToCaptions(
  script: string,
  totalDuration: number,
  wordsPerCaption: number = 3,
  wordsPerSecond: number = 2.6
): CaptionItem[] {
  const cleanScript = script.replace(/[\n\r]+/g, ' ').trim();
  if (!cleanScript) return [];

  const rawWords = cleanScript.split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < rawWords.length; i += wordsPerCaption) {
    chunks.push(rawWords.slice(i, i + wordsPerCaption));
  }

  // If total duration is provided and valid, scale word timings to fit exactly
  const targetDur = totalDuration > 0 ? totalDuration : rawWords.length / wordsPerSecond;
  const rawDuration = rawWords.length / wordsPerSecond;
  const scale = targetDur / Math.max(rawDuration, 1);

  let currentTime = 0;
  const items: CaptionItem[] = chunks.map((chunkWords, idx) => {
    const chunkWordCount = chunkWords.length;
    const baseDuration = (chunkWordCount / wordsPerSecond) * scale;
    const start = currentTime;
    const end = Math.min(currentTime + baseDuration, targetDur);
    currentTime = end;

    // Detect common viral words for highlight
    const text = chunkWords.join(' ');
    const highlightWords = chunkWords.filter((w) =>
      /^(10x|never|secret|money|million|free|viral|crazy|stop|how|hack|truth|huge|fast|\$\d+|\d+)/i.test(
        w.replace(/[^a-zA-Z0-9$]/g, '')
      )
    );

    return {
      id: `cap_${Date.now()}_${idx}`,
      text,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      highlightWords,
    };
  });

  // Clamp last caption to target duration
  if (items.length > 0) {
    items[items.length - 1].end = Number(targetDur.toFixed(2));
  }

  return items;
}
