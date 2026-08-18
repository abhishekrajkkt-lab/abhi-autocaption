import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Upload,
  Sparkles,
} from 'lucide-react';
import { AspectRatio, CaptionItem, StyleSettings } from '../types';
import { CAPTION_TEMPLATES } from '../constants/templates';
import { formatTime } from '../utils/subtitles';

interface VideoStageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSrc: string | null;
  aspectRatio: AspectRatio;
  captions: CaptionItem[];
  style: StyleSettings;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  onUploadClick: () => void;
  onDropVideo: (file: File) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  onOpenAutoCaptionModal: () => void;
}

export const VideoStage: React.FC<VideoStageProps> = ({
  videoRef,
  videoSrc,
  aspectRatio,
  captions,
  style,
  currentTime,
  duration,
  isPlaying,
  onPlayToggle,
  onSeek,
  onUploadClick,
  onDropVideo,
  playbackRate,
  onPlaybackRateChange,
  onOpenAutoCaptionModal,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find active caption
  const activeCaption = captions.find(
    (c) => currentTime >= c.start && currentTime <= c.end
  );

  const currentTemplate =
    CAPTION_TEMPLATES.find((t) => t.id === style.templateId) || CAPTION_TEMPLATES[0];

  // Aspect ratio classes
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[70vh] max-w-[42vh]';
      case '16:9':
        return 'aspect-[16/9] max-w-[85%] max-h-[65vh]';
      case '1:1':
        return 'aspect-square max-h-[65vh] max-w-[65vh]';
      case '4:5':
        return 'aspect-[4/5] max-h-[68vh] max-w-[55vh]';
      default:
        return 'aspect-[9/16] max-h-[70vh]';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onDropVideo(e.dataTransfer.files[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const jumpSeconds = (delta: number) => {
    const nextTime = Math.max(0, Math.min(duration, currentTime + delta));
    onSeek(nextTime);
  };

  // Compute active word index inside caption
  let activeWordIndex = -1;
  let words: string[] = [];
  if (activeCaption) {
    words = activeCaption.text.split(/\s+/).filter(Boolean);
    const capDur = Math.max(0.1, activeCaption.end - activeCaption.start);
    const timeIn = Math.max(0, currentTime - activeCaption.start);
    const wordDur = capDur / words.length;
    activeWordIndex = Math.min(words.length - 1, Math.floor(timeIn / wordDur));
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col min-w-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 gap-3 relative overflow-hidden select-none"
    >
      {/* Video Viewport Area */}
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative bg-black/50 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl border transition-all flex items-center justify-center ${getAspectRatioClasses()} ${
            isDragOver
              ? 'border-purple-500 ring-4 ring-purple-500/30 scale-[1.01]'
              : 'border-white/15 shadow-black/80'
          }`}
        >
          {/* Resolution / FPS Badges */}
          <div className="absolute top-3 right-3 z-20 flex gap-1.5 pointer-events-none">
            <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-[9px] font-mono rounded-full border border-white/15 text-white/80">
              {aspectRatio === '9:16'
                ? '1080 × 1920'
                : aspectRatio === '16:9'
                ? '1920 × 1080'
                : aspectRatio === '1:1'
                ? '1080 × 1080'
                : '1080 × 1350'}
            </div>
            <div className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-[9px] font-mono rounded-full border border-white/15 text-white/80">
              30 FPS
            </div>
          </div>

          {/* Main Video Element */}
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              playsInline
              crossOrigin="anonymous"
              onError={async () => {
                console.warn('Video source failed to load, generating local fallback background stream...');
                try {
                  const { generateFallbackVideoBlob } = await import('../utils/sampleVideoGenerator');
                  const fallbackUrl = await generateFallbackVideoBlob(aspectRatio, duration || 15);
                  if (fallbackUrl && videoRef.current) {
                    videoRef.current.src = fallbackUrl;
                    videoRef.current.load();
                  }
                } catch (e) {
                  console.error('Error falling back video:', e);
                }
              }}
              className="w-full h-full object-cover select-none pointer-events-auto cursor-pointer"
              onClick={onPlayToggle}
            />
          ) : (
            /* Upload / Drop Placeholder */
            <div
              onClick={onUploadClick}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-gradient-to-b from-white/5 to-black/60 hover:from-white/10 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-white/20 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-purple-400 transition-all shadow-lg">
                <Upload className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">
                Drop your video here
              </h3>
              <p className="text-xs text-white/50 max-w-[220px] leading-relaxed mb-4">
                MP4, WebM or MOV. Processed 100% locally in your browser.
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-full shadow-md hover:bg-white/90 transition-all">
                  Browse Video
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAutoCaptionModal();
                  }}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-full border border-white/15 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  <span>AI Script</span>
                </button>
              </div>
            </div>
          )}

          {/* TikTok / Instagram Safe Zone Overlay Simulator */}
          {style.showSafeZone && (
            <div className="absolute inset-0 pointer-events-none border-2 border-red-500/40 flex flex-col justify-between p-3 select-none">
              <div className="flex justify-between items-center text-[9px] font-mono text-red-300 bg-red-950/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-red-500/40">
                <span>Safe Zone: Top Nav Bar (Avoid)</span>
              </div>
              <div className="flex justify-end pr-2">
                <div className="flex flex-col gap-1.5 items-center text-[8px] text-red-200 font-mono bg-red-950/70 backdrop-blur-sm p-1.5 rounded-xl border border-red-500/40">
                  <span>Likes</span>
                  <span>Comments</span>
                  <span>Share</span>
                </div>
              </div>
              <div className="text-[9px] font-mono text-red-300 bg-red-950/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-red-500/40 text-center">
                <span>Safe Zone: Bottom UI (Avoid)</span>
              </div>
            </div>
          )}

          {/* Dynamic Caption Overlay */}
          {activeCaption && (
            <div
              className="absolute left-4 right-4 flex items-center pointer-events-none transition-all duration-75 select-none"
              style={{
                top: `${style.posPctY}%`,
                transform: 'translateY(-50%)',
                justifyContent:
                  style.posAlignX === 'left'
                    ? 'flex-start'
                    : style.posAlignX === 'right'
                    ? 'flex-end'
                    : 'center',
              }}
            >
              <div
                className="inline-block text-center max-w-[94%] transition-transform"
                style={{
                  fontFamily: style.fontFamily || currentTemplate.fontFamily,
                  fontWeight: style.fontWeight || currentTemplate.fontWeight,
                  fontSize: `${style.fontSize}px`,
                  lineHeight: 1.25,
                  textTransform: style.textTransform,
                  fontStyle: currentTemplate.italic ? 'italic' : 'normal',
                  backgroundColor: currentTemplate.boxPerPhrase ? style.bgColor : 'transparent',
                  padding: currentTemplate.boxPerPhrase ? `${style.bgPadding}px ${style.bgPadding * 1.5}px` : '0',
                  borderRadius: `${style.borderRadius}px`,
                  boxShadow: currentTemplate.boxPerPhrase && style.shadowBlur > 0
                    ? `0 4px ${style.shadowBlur}px ${style.shadowColor}`
                    : 'none',
                }}
              >
                {words.map((word, wIdx) => {
                  const isActive = wIdx === activeWordIndex;
                  const isPowerWord =
                    activeCaption.highlightWords?.some(
                      (hw) => hw.toLowerCase() === word.toLowerCase()
                    );

                  let color = style.textColor || currentTemplate.textColor;
                  if (isActive) {
                    color = style.highlightColor || currentTemplate.highlightColor;
                  } else if (isPowerWord) {
                    color = style.secondaryColor || currentTemplate.secondaryColor || '#38BDF8';
                  }

                  // Word outline style
                  const strokeStyle =
                    style.outlineWidth > 0
                      ? {
                          WebkitTextStroke: `${style.outlineWidth}px ${style.outlineColor || '#000000'}`,
                          paintOrder: 'stroke fill',
                        }
                      : {};

                  // Glow effect
                  const glowStyle = currentTemplate.glow
                    ? {
                        textShadow: isActive
                          ? `0 0 16px ${style.highlightColor}, 0 0 30px ${style.highlightColor}`
                          : `0 0 8px ${currentTemplate.shadowColor}`,
                      }
                    : style.shadowBlur > 0
                    ? { textShadow: `0 2px ${style.shadowBlur}px ${style.shadowColor}` }
                    : {};

                  return (
                    <span
                      key={wIdx}
                      className={`inline-block mx-[0.14em] transition-transform ${
                        isActive && (style.animation === 'pop' || style.animation === 'bounce')
                          ? 'animate-word-pop font-black'
                          : ''
                      } ${isActive && currentTemplate.glow ? 'animate-neon' : ''}`}
                      style={{
                        color: currentTemplate.boxPerWord && isActive ? '#000000' : color,
                        backgroundColor:
                          currentTemplate.boxPerWord && isActive
                            ? style.highlightColor
                            : 'transparent',
                        padding: currentTemplate.boxPerWord && isActive ? '2px 8px' : '0',
                        borderRadius: currentTemplate.boxPerWord && isActive ? '999px' : '0',
                        ...strokeStyle,
                        ...glowStyle,
                      }}
                    >
                      {/* Bionic speed reading effect */}
                      {style.bionicReading ? (
                        <>
                          <span className="font-extrabold text-purple-300">
                            {word.slice(0, Math.ceil(word.length / 2))}
                          </span>
                          <span>{word.slice(Math.ceil(word.length / 2))}</span>
                        </>
                      ) : (
                        word
                      )}
                    </span>
                  );
                })}

                {/* Optional contextual reaction emoji */}
                {style.showEmojis && activeCaption.emoji && (
                  <span className="inline-block ml-1.5 text-[1.1em] animate-float drop-shadow-md">
                    {activeCaption.emoji}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage Playback Bar - Frosted Glass Bar */}
      <div className="h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 flex items-center justify-between gap-4 select-none shrink-0">
        {/* Playback Transport Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => jumpSeconds(-3)}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Jump back 3 seconds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onPlayToggle}
            className="w-8 h-8 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black flex items-center justify-center font-bold transition-all shadow-md shadow-white/10"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => jumpSeconds(3)}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Jump forward 3 seconds"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrub Bar Slider */}
        <div className="flex-1 flex items-center gap-3">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              onSeek(pct * duration);
            }}
            className="flex-1 h-2 bg-white/10 hover:h-2.5 rounded-full cursor-pointer relative transition-all group overflow-hidden"
          >
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 via-indigo-400 to-blue-400 rounded-full transition-all"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="text-[11px] font-mono text-white/60 w-24 text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Secondary Controls (Volume, Speed) */}
        <div className="flex items-center gap-1.5">
          {/* Speed Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-[11px] font-mono font-bold text-white/70 hover:text-white px-2 py-0.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all"
            >
              {playbackRate}x
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-[#0A0B14]/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 z-50 min-w-[70px]">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onPlaybackRateChange(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2.5 py-1 text-left text-xs font-mono rounded-lg font-semibold transition-colors ${
                      playbackRate === rate
                        ? 'bg-purple-600 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
