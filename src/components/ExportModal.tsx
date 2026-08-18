import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Video,
  Check,
  Film,
  Code2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CaptionItem, CaptionTemplate, StyleSettings } from '../types';
import { exportToSrt, exportToVtt, triggerFileDownload } from '../utils/subtitles';
import { exportBurnedVideo } from '../utils/canvasRenderer';
import { downloadProjectSourceZip } from '../utils/downloadCode';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement: HTMLVideoElement | null;
  captions: CaptionItem[];
  template: CaptionTemplate;
  style: StyleSettings;
  duration: number;
  projectName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoElement,
  captions,
  template,
  style,
  duration,
  projectName,
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const handleExportBurnedVideo = async () => {
    if (!videoElement) {
      alert('Please load or select a video before exporting.');
      return;
    }
    if (captions.length === 0) {
      alert('Please add or generate captions first.');
      return;
    }

    setIsExportingVideo(true);
    setRenderProgress(0);

    let width = 1080;
    let height = 1920;
    if (resolution === '720p') {
      width = 720;
      height = 1280;
    } else if (resolution === '4k') {
      width = 2160;
      height = 3840;
    }

    try {
      const blob = await exportBurnedVideo({
        videoElement,
        captions,
        template,
        style,
        duration: duration || videoElement.duration || 15,
        width,
        height,
        fps: 30,
        onProgress: (pct) => setRenderProgress(pct),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName || 'reeltype-video'}-captioned.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setIsExportingVideo(false);
      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export failed: ${err?.message || 'Unknown error'}`);
      setIsExportingVideo(false);
    }
  };

  const handleDownloadSrt = () => {
    const srt = exportToSrt(captions);
    triggerFileDownload(srt, `${projectName || 'captions'}.srt`, 'text/plain');
  };

  const handleDownloadVtt = () => {
    const vtt = exportToVtt(captions);
    triggerFileDownload(vtt, `${projectName || 'captions'}.vtt`, 'text/vtt');
  };

  const handleDownloadJson = () => {
    const data = JSON.stringify(captions, null, 2);
    triggerFileDownload(data, `${projectName || 'captions'}.json`, 'application/json');
  };

  const handleCopyTranscript = () => {
    const plainText = captions.map((c) => c.text).join(' ');
    navigator.clipboard.writeText(plainText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0B14]/85 border border-white/15 backdrop-blur-2xl rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center text-black font-extrabold shadow-md">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Export & Share
              </h3>
              <p className="text-xs text-white/50">
                Render video with burned-in captions or export subtitle files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Main Video Burn Option */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-300" />
                <h4 className="text-xs font-bold text-white">Burned-in Subtitle Video</h4>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                Ready to Post
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Render Resolution</label>
              <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                {(['720p', '1080p', '4k'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      resolution === res ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {isExportingVideo ? (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-xs font-mono font-bold text-purple-300">
                  <span>Rendering Frames...</span>
                  <span>{renderProgress}%</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-150"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleExportBurnedVideo}
                className="w-full py-2.5 bg-white hover:bg-white/90 active:scale-95 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Render & Download Video ({resolution})</span>
              </button>
            )}
          </div>

          {/* Subtitle File Downloads */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/50">
              Subtitle & Script Files
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadSrt}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300">
                    SRT Subtitles
                  </div>
                  <div className="text-[9px] text-white/40">Premiere, CapCut, YouTube</div>
                </div>
                <Download className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
              </button>

              <button
                onClick={handleDownloadVtt}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300">
                    WebVTT File
                  </div>
                  <div className="text-[9px] text-white/40">Web & HTML5 Players</div>
                </div>
                <Download className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadJson}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300">
                    JSON Timestamps
                  </div>
                  <div className="text-[9px] text-white/40">Structured Raw Data</div>
                </div>
                <Download className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
              </button>

              <button
                onClick={handleCopyTranscript}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300">
                    {copiedText ? 'Copied!' : 'Copy Script Text'}
                  </div>
                  <div className="text-[9px] text-white/40">Plain text transcript</div>
                </div>
                {copiedText ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-white/40 group-hover:text-white" />
                )}
              </button>
            </div>

            {/* Complete Project Code ZIP */}
            <div className="pt-2">
              <button
                onClick={() => downloadProjectSourceZip(projectName)}
                className="w-full p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-2xl text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300">
                      Download Full Project Source Code (.ZIP)
                    </div>
                    <div className="text-[9px] text-white/50">
                      Complete React + Express + TypeScript + Gemini studio repository
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-purple-300 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
