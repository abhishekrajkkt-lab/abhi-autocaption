import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  Scissors,
  ZoomIn,
  ZoomOut,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { CaptionItem, StyleSettings } from '../types';
import { formatTime } from '../utils/subtitles';

interface TimelineProps {
  captions: CaptionItem[];
  selectedCaptionId: string | null;
  onSelectCaption: (id: string) => void;
  onUpdateCaption: (id: string, updates: Partial<CaptionItem>) => void;
  onAddCaption: () => void;
  onDeleteCaption: (id: string) => void;
  onSplitCaptionAtPlayhead: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  style: StyleSettings;
}

export const Timeline: React.FC<TimelineProps> = ({
  captions,
  selectedCaptionId,
  onSelectCaption,
  onUpdateCaption,
  onAddCaption,
  onDeleteCaption,
  onSplitCaptionAtPlayhead,
  currentTime,
  duration,
  onSeek,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 to 3
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const safeDuration = Math.max(duration || 10, 0.1);

  // Time ruler ticks calculation
  const tickStep = safeDuration > 40 ? 5 : safeDuration > 15 ? 2 : 1;
  const ticks: number[] = [];
  for (let s = 0; s <= safeDuration; s += tickStep) {
    ticks.push(s);
  }

  // Handle timeline scrub
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + trackRef.current.scrollLeft;
    const totalWidth = trackRef.current.scrollWidth;
    const newTime = Math.max(0, Math.min(safeDuration, (clickX / totalWidth) * safeDuration));
    onSeek(newTime);
  };

  // Dragging Playhead
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingPlayhead || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left + trackRef.current.scrollLeft;
      const totalWidth = trackRef.current.scrollWidth;
      const newTime = Math.max(0, Math.min(safeDuration, (clickX / totalWidth) * safeDuration));
      onSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, safeDuration, onSeek]);

  // Make caption pill draggable / resizable
  const startPillDrag = (
    e: React.MouseEvent,
    cap: CaptionItem,
    type: 'move' | 'left-handle' | 'right-handle'
  ) => {
    e.stopPropagation();
    onSelectCaption(cap.id);

    const startX = e.clientX;
    const origStart = cap.start;
    const origEnd = cap.end;
    const trackWidth = trackRef.current?.scrollWidth || 1;

    const onMove = (moveEv: MouseEvent) => {
      const deltaPx = moveEv.clientX - startX;
      const deltaTime = (deltaPx / trackWidth) * safeDuration;

      if (type === 'move') {
        const len = origEnd - origStart;
        let newStart = Math.max(0, origStart + deltaTime);
        let newEnd = newStart + len;
        if (newEnd > safeDuration) {
          newEnd = safeDuration;
          newStart = Math.max(0, newEnd - len);
        }
        onUpdateCaption(cap.id, {
          start: Number(newStart.toFixed(2)),
          end: Number(newEnd.toFixed(2)),
        });
      } else if (type === 'left-handle') {
        const newStart = Math.max(0, Math.min(origEnd - 0.2, origStart + deltaTime));
        onUpdateCaption(cap.id, { start: Number(newStart.toFixed(2)) });
      } else if (type === 'right-handle') {
        const newEnd = Math.min(safeDuration, Math.max(origStart + 0.2, origEnd + deltaTime));
        onUpdateCaption(cap.id, { end: Number(newEnd.toFixed(2)) });
      }
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Nudge timing of selected caption
  const nudgeSelected = (delta: number) => {
    if (!selectedCaptionId) return;
    const cap = captions.find((c) => c.id === selectedCaptionId);
    if (!cap) return;
    const len = cap.end - cap.start;
    const newStart = Math.max(0, Math.min(safeDuration - len, cap.start + delta));
    onUpdateCaption(cap.id, {
      start: Number(newStart.toFixed(2)),
      end: Number((newStart + len).toFixed(2)),
    });
  };

  return (
    <div className="h-44 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col shrink-0 select-none overflow-hidden z-20">
      {/* Timeline Controls Header */}
      <div className="h-10 px-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-white/50">Timeline</span>
          <span className="text-xs font-mono text-purple-300">
            {formatTime(currentTime)} / {formatTime(safeDuration, true)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {selectedCaptionId && (
            <>
              <button
                onClick={() => nudgeSelected(-0.1)}
                className="flex items-center gap-1 text-[10px] font-semibold text-white/70 hover:text-white px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                title="Nudge -0.1s"
              >
                <ChevronsLeft className="w-3 h-3" />
                <span>-0.1s</span>
              </button>
              <button
                onClick={() => nudgeSelected(0.1)}
                className="flex items-center gap-1 text-[10px] font-semibold text-white/70 hover:text-white px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                title="Nudge +0.1s"
              >
                <span>+0.1s</span>
                <ChevronsRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDeleteCaption(selectedCaptionId)}
                className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-full border border-rose-500/30 transition-colors"
                title="Delete selected caption"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}

          <button
            onClick={onSplitCaptionAtPlayhead}
            className="flex items-center gap-1 text-[10px] font-semibold text-white/80 hover:text-white px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            title="Split subtitle at playhead position"
          >
            <Scissors className="w-3 h-3 text-purple-300" />
            <span>Split</span>
          </button>

          <button
            onClick={onAddCaption}
            className="flex items-center gap-1 text-[10px] font-bold text-white px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-sm transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>Add Block</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 ml-2 border-l border-white/10 pl-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
              className="p-1 text-white/60 hover:text-white rounded-full"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-white/40 w-5 text-center">
              {zoomLevel}x
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
              className="p-1 text-white/60 hover:text-white rounded-full"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Timeline Body Track */}
      <div
        ref={trackRef}
        onClick={handleTimelineClick}
        className="flex-1 relative overflow-x-auto overflow-y-hidden bg-black/30 cursor-pointer"
      >
        <div
          className="h-full relative transition-all"
          style={{ width: `${100 * zoomLevel}%`, minWidth: '100%' }}
        >
          {/* Time Ruler */}
          <div className="h-6 border-b border-white/5 relative pointer-events-none">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 border-l border-white/10"
                style={{ left: `${(tick / safeDuration) * 100}%` }}
              >
                <span className="absolute top-1 left-1.5 text-[9px] font-mono text-white/40">
                  {formatTime(tick)}
                </span>
              </div>
            ))}
          </div>

          {/* Simulated Audio Waveform Bar */}
          <div className="absolute top-7 left-0 right-0 h-6 opacity-20 pointer-events-none flex items-center gap-0.5 px-1 overflow-hidden">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-purple-400 rounded-full"
                style={{
                  height: `${Math.max(15, ((Math.sin(i * 0.4) + Math.cos(i * 0.9) + 2) / 4) * 100)}%`,
                }}
              />
            ))}
          </div>

          {/* Captions Lane */}
          <div className="absolute top-13 bottom-2 left-0 right-0">
            {captions.map((cap, idx) => {
              const isSelected = selectedCaptionId === cap.id;
              const isCurrent = currentTime >= cap.start && currentTime <= cap.end;

              const leftPct = (cap.start / safeDuration) * 100;
              const widthPct = Math.max(0.8, ((cap.end - cap.start) / safeDuration) * 100);

              // Alternate purple / blue frosted cards
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={cap.id}
                  onMouseDown={(e) => startPillDrag(e, cap, 'move')}
                  className={`absolute top-1 bottom-1 rounded-xl px-2.5 flex items-center justify-between border cursor-grab active:cursor-grabbing transition-all overflow-hidden group shadow-md backdrop-blur-md ${
                    isSelected
                      ? 'border-purple-400 bg-purple-600/30 border-l-4 border-l-purple-400 ring-2 ring-purple-400/40 z-10'
                      : isCurrent
                      ? 'border-blue-400/60 bg-blue-500/20 border-l-4 border-l-blue-400'
                      : isEven
                      ? 'border-white/10 bg-purple-500/15 border-l-4 border-l-purple-500/60 hover:border-purple-500/40 hover:bg-purple-500/25'
                      : 'border-white/10 bg-blue-500/15 border-l-4 border-l-blue-500/60 hover:border-blue-500/40 hover:bg-blue-500/25'
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                >
                  {/* Left Trim Handle */}
                  <div
                    onMouseDown={(e) => startPillDrag(e, cap, 'left-handle')}
                    className="absolute left-0 top-0 bottom-0 w-2 hover:bg-purple-400 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-white/20"
                  />

                  {/* Caption Info & Snippet */}
                  <div className="flex flex-col justify-center overflow-hidden pointer-events-none px-1 leading-tight">
                    <span className="text-[8px] font-mono text-purple-200/70 font-semibold truncate">
                      {formatTime(cap.start)} - {formatTime(cap.end)}
                    </span>
                    <div className="flex items-center gap-1 overflow-hidden">
                      {cap.emoji && <span className="text-[10px]">{cap.emoji}</span>}
                      <span className="text-[10px] font-bold text-white truncate max-w-full">
                        {cap.text}
                      </span>
                    </div>
                  </div>

                  {/* Right Trim Handle */}
                  <div
                    onMouseDown={(e) => startPillDrag(e, cap, 'right-handle')}
                    className="absolute right-0 top-0 bottom-0 w-2 hover:bg-purple-400 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-white/20"
                  />
                </div>
              );
            })}
          </div>

          {/* Timeline Playhead */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingPlayhead(true);
            }}
            className="absolute top-0 bottom-0 w-0.5 bg-purple-400 z-30 pointer-events-auto cursor-ew-resize shadow-[0_0_12px_rgba(168,85,247,0.8)]"
            style={{
              left: `${safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0}%`,
            }}
          >
            {/* Playhead marker handle */}
            <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-purple-400 rounded-sm rotate-45 border border-white flex items-center justify-center shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};
