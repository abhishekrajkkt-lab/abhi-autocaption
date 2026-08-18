import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Video,
  Smartphone,
  Monitor,
  Square,
  RectangleVertical,
  Check,
  Edit2,
  Code2,
} from 'lucide-react';
import { AspectRatio } from '../types';
import { downloadProjectSourceZip } from '../utils/downloadCode';

interface HeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onOpenAutoCaptionModal: () => void;
  onOpenExportModal: () => void;
  onUploadClick: () => void;
  captionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onProjectNameChange,
  aspectRatio,
  onAspectRatioChange,
  onOpenAutoCaptionModal,
  onOpenExportModal,
  onUploadClick,
  captionCount,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectName);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onProjectNameChange(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-16 shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-md px-6 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Title Zone */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md shadow-purple-500/20">
            CC
          </div>
          <div className="flex items-baseline">
            <h1 className="text-base font-semibold tracking-tight text-white">
              CaptionPro
            </h1>
            <span className="text-xs font-normal text-white/40 ml-2 italic">
              v2.4 AI Studio
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              onBlur={handleTitleSubmit}
              autoFocus
              className="bg-white/10 border border-purple-500/60 text-xs text-white px-2.5 py-1 rounded-lg outline-none w-48 font-medium backdrop-blur-md"
            />
            <button
              onClick={handleTitleSubmit}
              className="p-1 hover:bg-white/10 rounded-lg text-emerald-400"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTempTitle(projectName);
              setIsEditingTitle(true);
            }}
            className="group flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
            title="Click to rename project"
          >
            <span className="max-w-[170px] truncate font-medium">{projectName}</span>
            <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-white/40" />
          </button>
        )}

        {captionCount > 0 && (
          <span className="text-[10px] font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300 px-2.5 py-0.5 rounded-full hidden md:inline-block">
            {captionCount} {captionCount === 1 ? 'caption' : 'captions'}
          </span>
        )}
      </div>

      {/* Center Zone: Aspect Ratio Selector */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
        <button
          onClick={() => onAspectRatioChange('9:16')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            aspectRatio === '9:16'
              ? 'bg-white/20 text-white shadow-sm border border-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="TikTok / Shorts / Reels (9:16)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>9:16</span>
        </button>

        <button
          onClick={() => onAspectRatioChange('16:9')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            aspectRatio === '16:9'
              ? 'bg-white/20 text-white shadow-sm border border-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="YouTube / Landscape (16:9)"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>16:9</span>
        </button>

        <button
          onClick={() => onAspectRatioChange('1:1')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            aspectRatio === '1:1'
              ? 'bg-white/20 text-white shadow-sm border border-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Instagram Square (1:1)"
        >
          <Square className="w-3.5 h-3.5" />
          <span>1:1</span>
        </button>

        <button
          onClick={() => onAspectRatioChange('4:5')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            aspectRatio === '4:5'
              ? 'bg-white/20 text-white shadow-sm border border-white/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Portrait Feed (4:5)"
        >
          <RectangleVertical className="w-3.5 h-3.5" />
          <span>4:5</span>
        </button>
      </div>

      {/* Action Zone: AI Auto-Caption & Export */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/70">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></span>
          <span>AI Engine: Active</span>
        </div>

        <button
          onClick={onUploadClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/90 transition-all hover:border-white/20"
        >
          <Video className="w-3.5 h-3.5 text-blue-400" />
          <span>Upload</span>
        </button>

        <button
          onClick={onOpenAutoCaptionModal}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-purple-900/30 transition-all active:scale-95 hover:opacity-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span>Auto-Captions</span>
          <span className="px-1.5 py-0.2 bg-white/20 text-[9px] font-extrabold rounded-full uppercase">
            AI
          </span>
        </button>

        <button
          onClick={() => downloadProjectSourceZip(projectName)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all hover:border-white/20"
          title="Download full project code as ZIP"
        >
          <Code2 className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Download Code</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-all active:scale-95 shadow-md shadow-white/10"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
