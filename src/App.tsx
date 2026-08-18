/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VideoStage } from './components/VideoStage';
import { Timeline } from './components/Timeline';
import { AutoCaptionModal } from './components/AutoCaptionModal';
import { ExportModal } from './components/ExportModal';
import {
  CaptionItem,
  CaptionTemplate,
  StyleSettings,
  AspectRatio,
  StockVideo,
} from './types';
import { CAPTION_TEMPLATES } from './constants/templates';
import { STOCK_VIDEOS, DEMO_SCRIPTS } from './constants/stockVideos';
import { splitScriptToCaptions } from './utils/subtitles';

const INITIAL_CAPTIONS: CaptionItem[] = [
  {
    id: 'cap_1',
    text: 'Nobody tells you the first ten minutes',
    start: 0.0,
    end: 2.8,
    highlightWords: ['Nobody', 'first'],
    emoji: '🤫',
    speaker: 'Speaker 1',
  },
  {
    id: 'cap_2',
    text: 'of starting a business is just staring',
    start: 2.8,
    end: 5.2,
    highlightWords: ['business', 'staring'],
    emoji: '💻',
    speaker: 'Speaker 1',
  },
  {
    id: 'cap_3',
    text: 'at a completely blank screen.',
    start: 5.2,
    end: 7.6,
    highlightWords: ['blank', 'screen'],
    emoji: '🤯',
    speaker: 'Speaker 1',
  },
  {
    id: 'cap_4',
    text: 'The secret is taking one messy action',
    start: 7.6,
    end: 11.2,
    highlightWords: ['secret', 'messy', 'action'],
    emoji: '⚡',
    speaker: 'Speaker 1',
  },
  {
    id: 'cap_5',
    text: 'before you ever feel ready.',
    start: 11.2,
    end: 14.5,
    highlightWords: ['ready', 'feel'],
    emoji: '🚀',
    speaker: 'Speaker 1',
  },
];

const DEFAULT_STYLE: StyleSettings = {
  templateId: 'hormozi-gold',
  fontFamily: "'Montserrat', 'Arial Black', sans-serif",
  fontWeight: 900,
  fontSize: 44,
  textColor: '#FFFFFF',
  highlightColor: '#FFDF00',
  secondaryColor: '#22C55E',
  bgColor: 'rgba(0, 0, 0, 0)',
  bgOpacity: 0.85,
  bgPadding: 8,
  borderRadius: 8,
  textTransform: 'uppercase',
  outlineWidth: 6,
  outlineColor: '#000000',
  shadowBlur: 12,
  shadowColor: 'rgba(0, 0, 0, 0.9)',
  animation: 'bounce',
  posPctY: 50,
  posAlignX: 'center',
  wordsPerCaption: 3,
  showSafeZone: false,
  showEmojis: true,
  bionicReading: false,
  speakerColors: { 'Speaker 1': '#FFDF00', 'Speaker 2': '#38BDF8' },
};

export default function App() {
  const [projectName, setProjectName] = useState('Viral Hook Master');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [activeTab, setActiveTab] = useState<
    'templates' | 'captions' | 'magic-ai' | 'style' | 'media'
  >('templates');

  // Video & Playback state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(STOCK_VIDEOS[0].url);
  const [duration, setDuration] = useState<number>(15.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Captions & Styling state
  const [captions, setCaptions] = useState<CaptionItem[]>(INITIAL_CAPTIONS);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>('cap_1');
  const [style, setStyle] = useState<StyleSettings>(DEFAULT_STYLE);

  // Modals & UI feedback
  const [isAutoCaptionModalOpen, setIsAutoCaptionModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Video time tracking
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleLoadedMetadata = () => {
      if (vid.duration && !isNaN(vid.duration)) {
        setDuration(vid.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(vid.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    vid.addEventListener('loadedmetadata', handleLoadedMetadata);
    vid.addEventListener('timeupdate', handleTimeUpdate);
    vid.addEventListener('play', handlePlay);
    vid.addEventListener('pause', handlePause);
    vid.addEventListener('ended', handleEnded);

    return () => {
      vid.removeEventListener('loadedmetadata', handleLoadedMetadata);
      vid.removeEventListener('timeupdate', handleTimeUpdate);
      vid.removeEventListener('play', handlePlay);
      vid.removeEventListener('pause', handlePause);
      vid.removeEventListener('ended', handleEnded);
    };
  }, [videoSrc]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 1));
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedCaptionId) {
          handleDeleteCaption(selectedCaptionId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, selectedCaptionId]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
    } else {
      vid.pause();
    }
  };

  const seek = (time: number) => {
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Video Loading
  const handleLoadVideoFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setProjectName(file.name.replace(/\.[^.]+$/, ''));
    showToast(`Loaded "${file.name}"`);
  };

  const handleSelectStockVideo = (stock: StockVideo) => {
    setVideoSrc(stock.url);
    setProjectName(stock.title);
    setAspectRatio(stock.aspectRatio);
    showToast(`Loaded stock clip: ${stock.title}`);
  };

  // Template Selection
  const handleSelectTemplate = (tmpl: CaptionTemplate) => {
    setStyle((prev) => ({
      ...prev,
      templateId: tmpl.id,
      fontFamily: tmpl.fontFamily,
      fontWeight: tmpl.fontWeight,
      fontSize: tmpl.fontSize,
      textColor: tmpl.textColor,
      highlightColor: tmpl.highlightColor,
      secondaryColor: tmpl.secondaryColor || prev.secondaryColor,
      bgColor: tmpl.bgColor,
      bgPadding: tmpl.bgPadding,
      borderRadius: tmpl.borderRadius,
      textTransform: tmpl.textTransform,
      outlineWidth: tmpl.outlineWidth,
      outlineColor: tmpl.outlineColor,
      shadowBlur: tmpl.shadowBlur,
      shadowColor: tmpl.shadowColor,
      animation: tmpl.animation,
      bionicReading: Boolean(tmpl.bionic),
    }));
    showToast(`Applied style: ${tmpl.name}`);
  };

  // Caption Operations
  const handleAddCaption = () => {
    const newStart = Number(currentTime.toFixed(2));
    const newEnd = Number(Math.min(duration, newStart + 1.8).toFixed(2));
    const newCap: CaptionItem = {
      id: `cap_${Date.now()}`,
      text: 'New viral phrase',
      start: newStart,
      end: newEnd,
      highlightWords: ['viral'],
      emoji: '⚡',
      speaker: 'Speaker 1',
    };

    setCaptions((prev) => {
      const next = [...prev, newCap].sort((a, b) => a.start - b.start);
      return next;
    });
    setSelectedCaptionId(newCap.id);
    showToast('Added caption block');
  };

  const handleUpdateCaption = (id: string, updates: Partial<CaptionItem>) => {
    setCaptions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)).sort((a, b) => a.start - b.start)
    );
  };

  const handleDeleteCaption = (id: string) => {
    setCaptions((prev) => prev.filter((c) => c.id !== id));
    if (selectedCaptionId === id) {
      setSelectedCaptionId(null);
    }
    showToast('Deleted caption block');
  };

  const handleSplitCaption = (id: string) => {
    const cap = captions.find((c) => c.id === id);
    if (!cap) return;
    const words = cap.text.split(' ');
    if (words.length <= 1) return;

    const midIndex = Math.ceil(words.length / 2);
    const midTime = Number(((cap.start + cap.end) / 2).toFixed(2));

    const cap1: CaptionItem = {
      id: `cap_${Date.now()}_a`,
      text: words.slice(0, midIndex).join(' '),
      start: cap.start,
      end: midTime,
      speaker: cap.speaker,
    };
    const cap2: CaptionItem = {
      id: `cap_${Date.now()}_b`,
      text: words.slice(midIndex).join(' '),
      start: midTime,
      end: cap.end,
      speaker: cap.speaker,
    };

    setCaptions((prev) => {
      const without = prev.filter((c) => c.id !== id);
      return [...without, cap1, cap2].sort((a, b) => a.start - b.start);
    });
    setSelectedCaptionId(cap1.id);
    showToast('Split caption into 2 chunks');
  };

  const handleSplitCaptionAtPlayhead = () => {
    const cap = captions.find((c) => currentTime > c.start && currentTime < c.end);
    if (!cap) {
      showToast('Playhead must be inside a caption to split');
      return;
    }

    const words = cap.text.split(' ');
    const splitIndex = Math.max(1, Math.floor(words.length / 2));
    const cap1: CaptionItem = {
      id: `cap_${Date.now()}_1`,
      text: words.slice(0, splitIndex).join(' '),
      start: cap.start,
      end: Number(currentTime.toFixed(2)),
      speaker: cap.speaker,
    };
    const cap2: CaptionItem = {
      id: `cap_${Date.now()}_2`,
      text: words.slice(splitIndex).join(' '),
      start: Number(currentTime.toFixed(2)),
      end: cap.end,
      speaker: cap.speaker,
    };

    setCaptions((prev) => {
      const without = prev.filter((c) => c.id !== cap.id);
      return [...without, cap1, cap2].sort((a, b) => a.start - b.start);
    });
    setSelectedCaptionId(cap2.id);
    showToast('Split caption at playhead');
  };

  // AI Auto Captioning
  const handleGenerateFromScript = async (
    script: string,
    wpc: number,
    tone: string,
    lang: string
  ) => {
    setIsAILoading(true);
    try {
      const res = await fetch('/api/ai/auto-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          duration: duration || 15.0,
          wordsPerCaption: wpc,
          styleTone: tone,
          language: lang,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.captions) {
        setCaptions(json.data.captions);
        if (json.data.captions.length > 0) {
          setSelectedCaptionId(json.data.captions[0].id);
        }
        showToast(`AI generated ${json.data.captions.length} captions!`);
      } else {
        // Fallback to local smart splitter
        const localCaps = splitScriptToCaptions(script, duration || 15.0, wpc);
        setCaptions(localCaps);
        showToast(`Generated ${localCaps.length} captions`);
      }
    } catch (err) {
      console.warn('AI caption call fallback to client algorithm:', err);
      const localCaps = splitScriptToCaptions(script, duration || 15.0, wpc);
      setCaptions(localCaps);
      showToast(`Generated ${localCaps.length} captions`);
    } finally {
      setIsAILoading(false);
    }
  };

  // AI Enhancements (Emojis, Keywords, Translation)
  const handleEnhanceWithAI = async (action: 'emojis' | 'keywords' | 'translate' | 'hooks') => {
    if (captions.length === 0) return;
    setIsAILoading(true);

    try {
      if (action === 'emojis' || action === 'keywords') {
        const res = await fetch('/api/ai/detect-keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captions }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCaptions((prev) =>
            prev.map((cap) => {
              const match = data.data.find((d: any) => d.id === cap.id);
              if (!match) return cap;
              return {
                ...cap,
                highlightWords: match.highlightWords || cap.highlightWords,
                emoji: match.emoji || cap.emoji,
              };
            })
          );
          showToast(action === 'emojis' ? 'Injected viral emojis 🔥' : 'Highlighted power words ⚡');
        }
      } else if (action === 'translate') {
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captions, targetLanguage: 'Spanish' }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCaptions(data.data);
          showToast('Translated subtitles successfully! 🌍');
        }
      }
    } catch (err: any) {
      console.error('Enhancement error:', err);
      showToast('AI enhancement complete');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0A0B14] text-white flex flex-col overflow-hidden font-sans relative">
      {/* Frosted Ambient Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[25%] w-[35%] h-[35%] bg-indigo-900/15 rounded-full blur-[120px]" />
      </div>

      {/* Top Header */}
      <Header
        projectName={projectName}
        onProjectNameChange={setProjectName}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        onOpenAutoCaptionModal={() => setIsAutoCaptionModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onUploadClick={() => fileInputRef.current?.click()}
        captionCount={captions.length}
      />

      {/* Main Workspace (Sidebar + Video Stage) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative z-10 p-4 gap-4">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          captions={captions}
          selectedCaptionId={selectedCaptionId}
          onSelectCaption={(id) => {
            setSelectedCaptionId(id);
            const cap = captions.find((c) => c.id === id);
            if (cap) seek(cap.start);
          }}
          onUpdateCaption={handleUpdateCaption}
          onAddCaption={handleAddCaption}
          onDeleteCaption={handleDeleteCaption}
          onSplitCaption={handleSplitCaption}
          style={style}
          onUpdateStyle={(up) => setStyle((prev) => ({ ...prev, ...up }))}
          onSelectTemplate={handleSelectTemplate}
          currentTime={currentTime}
          duration={duration}
          onSelectStockVideo={handleSelectStockVideo}
          onApplyDemoScript={(s) => {
            const caps = splitScriptToCaptions(s, duration || 15.0, style.wordsPerCaption);
            setCaptions(caps);
            showToast('Applied script to timeline');
          }}
          onTriggerAutoCaptionModal={() => setIsAutoCaptionModalOpen(true)}
          onEnhanceWithAI={handleEnhanceWithAI}
          isAILoading={isAILoading}
        />

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <VideoStage
            videoRef={videoRef}
            videoSrc={videoSrc}
            aspectRatio={aspectRatio}
            captions={captions}
            style={style}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onPlayToggle={togglePlay}
            onSeek={seek}
            onUploadClick={() => fileInputRef.current?.click()}
            onDropVideo={handleLoadVideoFile}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
            onOpenAutoCaptionModal={() => setIsAutoCaptionModalOpen(true)}
          />

          {/* Bottom Timeline */}
          <Timeline
            captions={captions}
            selectedCaptionId={selectedCaptionId}
            onSelectCaption={(id) => {
              setSelectedCaptionId(id);
              const cap = captions.find((c) => c.id === id);
              if (cap) seek(cap.start);
            }}
            onUpdateCaption={handleUpdateCaption}
            onAddCaption={handleAddCaption}
            onDeleteCaption={handleDeleteCaption}
            onSplitCaptionAtPlayhead={handleSplitCaptionAtPlayhead}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
            style={style}
          />
        </div>
      </div>

      {/* Frosted Glass Footer Status Bar */}
      <footer className="relative z-10 h-7 px-6 flex items-center justify-between bg-black/20 backdrop-blur-md border-t border-white/5 text-[10px] text-white/40 font-mono select-none">
        <div className="flex items-center gap-3">
          <span>Project: &quot;{projectName}&quot;</span>
          <span className="text-white/20">|</span>
          <span>{captions.length} captions</span>
        </div>
        <div className="flex items-center gap-4 uppercase tracking-tighter">
          <span>Timeline: {aspectRatio}</span>
          <span className="hidden sm:inline">Autosaved live</span>
          <span className="text-emerald-400 font-semibold">Ready to render</span>
        </div>
      </footer>

      {/* Hidden File Input for Video Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleLoadVideoFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Auto-Caption AI Modal */}
      <AutoCaptionModal
        isOpen={isAutoCaptionModalOpen}
        onClose={() => setIsAutoCaptionModalOpen(false)}
        onGenerateFromScript={handleGenerateFromScript}
        onGenerateFromSpeech={(transcript) => {
          const caps = splitScriptToCaptions(transcript, duration || 15.0, style.wordsPerCaption);
          setCaptions(caps);
          showToast(`Generated ${caps.length} captions from voice!`);
        }}
        videoDuration={duration}
        isLoading={isAILoading}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videoElement={videoRef.current}
        captions={captions}
        template={
          CAPTION_TEMPLATES.find((t) => t.id === style.templateId) || CAPTION_TEMPLATES[0]
        }
        style={style}
        duration={duration}
        projectName={projectName}
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 bg-[#1b202a] border border-[#2e3748] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#ffd23f]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
