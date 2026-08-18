import React, { useState } from 'react';
import {
  LayoutTemplate,
  Type,
  Sparkles,
  Sliders,
  Film,
  Plus,
  Trash2,
  Smile,
  Zap,
  Globe,
  Scissors,
  Check,
  Languages,
  Play,
} from 'lucide-react';
import {
  CaptionItem,
  CaptionTemplate,
  StyleSettings,
  StockVideo,
} from '../types';
import { CAPTION_TEMPLATES, COLOR_SWATCHES, FONT_OPTIONS } from '../constants/templates';
import { STOCK_VIDEOS, DEMO_SCRIPTS } from '../constants/stockVideos';
import { formatTime } from '../utils/subtitles';

interface SidebarProps {
  activeTab: 'templates' | 'captions' | 'magic-ai' | 'style' | 'media';
  onTabChange: (tab: 'templates' | 'captions' | 'magic-ai' | 'style' | 'media') => void;
  captions: CaptionItem[];
  selectedCaptionId: string | null;
  onSelectCaption: (id: string) => void;
  onUpdateCaption: (id: string, updates: Partial<CaptionItem>) => void;
  onAddCaption: () => void;
  onDeleteCaption: (id: string) => void;
  onSplitCaption: (id: string) => void;
  style: StyleSettings;
  onUpdateStyle: (updates: Partial<StyleSettings>) => void;
  onSelectTemplate: (template: CaptionTemplate) => void;
  currentTime: number;
  duration: number;
  onSelectStockVideo: (video: StockVideo) => void;
  onApplyDemoScript: (scriptText: string) => void;
  onTriggerAutoCaptionModal: () => void;
  onEnhanceWithAI: (action: 'emojis' | 'keywords' | 'translate' | 'hooks') => void;
  isAILoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  captions,
  selectedCaptionId,
  onSelectCaption,
  onUpdateCaption,
  onAddCaption,
  onDeleteCaption,
  onSplitCaption,
  style,
  onUpdateStyle,
  onSelectTemplate,
  currentTime,
  duration,
  onSelectStockVideo,
  onApplyDemoScript,
  onTriggerAutoCaptionModal,
  onEnhanceWithAI,
  isAILoading,
}) => {
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [targetLang, setTargetLang] = useState<string>('Spanish');

  const filteredTemplates = CAPTION_TEMPLATES.filter((t) => {
    if (templateFilter === 'all') return true;
    return t.category === templateFilter;
  });

  return (
    <aside className="w-80 shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col h-full select-none z-20 overflow-hidden">
      {/* Top Tab Rail */}
      <div className="flex items-center border-b border-white/10 bg-white/[0.02] p-1.5 gap-1 shrink-0">
        <button
          onClick={() => onTabChange('templates')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'templates'
              ? 'bg-white/15 text-white border border-white/20 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="22+ Viral Caption Templates"
        >
          <LayoutTemplate className="w-3.5 h-3.5 mb-0.5" />
          <span>Styles</span>
        </button>

        <button
          onClick={() => onTabChange('captions')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all relative ${
            activeTab === 'captions'
              ? 'bg-white/15 text-white border border-white/20 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Edit Subtitle Text & Timing"
        >
          <Type className="w-3.5 h-3.5 mb-0.5" />
          <span>Captions</span>
          {captions.length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-purple-400" />
          )}
        </button>

        <button
          onClick={() => onTabChange('magic-ai')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'magic-ai'
              ? 'bg-white/15 text-purple-300 border border-purple-500/30 shadow-sm'
              : 'text-white/60 hover:text-purple-300 hover:bg-white/5'
          }`}
          title="Gemini AI Auto-Enhancers"
        >
          <Sparkles className="w-3.5 h-3.5 mb-0.5 text-purple-300" />
          <span>AI Tools</span>
        </button>

        <button
          onClick={() => onTabChange('style')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'style'
              ? 'bg-white/15 text-white border border-white/20 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Custom Font, Colors & Position"
        >
          <Sliders className="w-3.5 h-3.5 mb-0.5" />
          <span>Format</span>
        </button>

        <button
          onClick={() => onTabChange('media')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'media'
              ? 'bg-white/15 text-white border border-white/20 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Stock Videos & Safe Zones"
        >
          <Film className="w-3.5 h-3.5 mb-0.5" />
          <span>Media</span>
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-3.5">
            {/* Hero AI Trigger */}
            <button
              onClick={onTriggerAutoCaptionModal}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 text-white shadow-lg shadow-purple-900/30 text-xs font-bold transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>Auto-Generate Captions with AI</span>
            </button>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                Preset Styles
              </span>
              <span className="text-[10px] font-mono text-purple-300">
                {CAPTION_TEMPLATES.length} templates
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['all', 'viral', 'neon', 'modern', 'minimal', 'retro', 'creative'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTemplateFilter(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap capitalize text-xs font-medium transition-all ${
                    templateFilter === cat
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template Grid Cards */}
            <div className="space-y-2.5">
              {filteredTemplates.map((template) => {
                const isSelected = style.templateId === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                    className={`group relative p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-600/20 ring-1 ring-purple-400/40 shadow-lg'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {/* Live Mini Preview Box */}
                    <div className="h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-2 overflow-hidden mb-2 relative backdrop-blur-md">
                      <div
                        className="text-center px-2 py-1 transition-transform group-hover:scale-105"
                        style={{
                          fontFamily: template.fontFamily,
                          fontWeight: template.fontWeight,
                          textTransform: template.textTransform,
                          fontStyle: template.italic ? 'italic' : 'normal',
                        }}
                      >
                        <span
                          style={{
                            color: template.textColor === 'transparent' ? '#ffffff' : template.textColor,
                            backgroundColor: template.boxPerPhrase ? template.bgColor : 'transparent',
                            padding: template.boxPerPhrase ? `${template.bgPadding / 2}px 8px` : '0',
                            borderRadius: `${template.borderRadius / 2}px`,
                            textShadow: template.glow
                              ? `0 0 10px ${template.highlightColor}`
                              : template.shadowBlur > 0
                              ? `0 2px 6px ${template.shadowColor}`
                              : 'none',
                            fontSize: '12px',
                          }}
                        >
                          MAKE IT{' '}
                          <span
                            style={{
                              backgroundColor: template.boxPerWord ? template.highlightColor : 'transparent',
                              color: template.boxPerWord ? '#000000' : template.highlightColor,
                              padding: template.boxPerWord ? '2px 6px' : '0',
                              borderRadius: template.boxPerWord ? '999px' : '0',
                            }}
                          >
                            VIRAL
                          </span>
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-400 text-black flex items-center justify-center shadow-md">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        {template.name}
                      </h4>
                      <span className="text-[9px] uppercase font-bold text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">
                      {template.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CAPTIONS EDITOR */}
        {activeTab === 'captions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                Captions List
              </span>
              <button
                onClick={onAddCaption}
                className="flex items-center gap-1 text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded-full shadow-sm transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Add Block</span>
              </button>
            </div>

            {captions.length === 0 ? (
              <div className="text-center py-8 px-4 bg-white/5 border border-dashed border-white/15 rounded-2xl">
                <Sparkles className="w-7 h-7 text-purple-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white mb-1">No captions yet</h4>
                <p className="text-[11px] text-white/50 mb-3">
                  Auto-generate from audio or paste your script in seconds.
                </p>
                <button
                  onClick={onTriggerAutoCaptionModal}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  Generate Auto-Captions
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {captions.map((cap, index) => {
                  const isSelected = selectedCaptionId === cap.id;
                  const isCurrent = currentTime >= cap.start && currentTime <= cap.end;

                  return (
                    <div
                      key={cap.id}
                      onClick={() => onSelectCaption(cap.id)}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-purple-400 bg-purple-600/20 ring-1 ring-purple-400/40 shadow-md'
                          : isCurrent
                          ? 'border-blue-400/60 bg-blue-500/15'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/10 text-[9px] font-mono font-bold text-white flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-[10px] font-mono text-purple-300">
                            {formatTime(cap.start, true)} → {formatTime(cap.end, true)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSplitCaption(cap.id);
                            }}
                            className="p-1 text-white/50 hover:text-blue-300 hover:bg-white/10 rounded-full"
                            title="Split caption"
                          >
                            <Scissors className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCaption(cap.id);
                            }}
                            className="p-1 text-white/50 hover:text-rose-400 hover:bg-white/10 rounded-full"
                            title="Delete caption"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={cap.text}
                        onChange={(e) => onUpdateCaption(cap.id, { text: e.target.value })}
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 focus:border-purple-400 text-xs text-white p-2 rounded-xl outline-none resize-none font-medium leading-relaxed"
                        placeholder="Caption text..."
                      />

                      {/* Highlight Words & Emoji Badges */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 text-[10px]">
                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[190px]">
                          {cap.emoji && (
                            <span className="bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded-full text-xs">
                              {cap.emoji}
                            </span>
                          )}
                          {cap.highlightWords?.map((hw, hIdx) => (
                            <span
                              key={hIdx}
                              className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full text-[9px] font-bold"
                            >
                              ⚡ {hw}
                            </span>
                          ))}
                        </div>

                        <select
                          value={cap.speaker || 'Speaker 1'}
                          onChange={(e) => onUpdateCaption(cap.id, { speaker: e.target.value })}
                          className="bg-white/5 text-white/70 text-[10px] px-2 py-0.5 rounded-full border border-white/10 outline-none"
                        >
                          <option value="Speaker 1" className="bg-[#0A0B14]">Speaker 1</option>
                          <option value="Speaker 2" className="bg-[#0A0B14]">Speaker 2</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MAGIC AI TOOLS */}
        {activeTab === 'magic-ai' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <h4 className="text-xs font-bold text-white">Gemini AI Studio Suite</h4>
              </div>
              <p className="text-[11px] text-purple-200/70 leading-relaxed mb-3">
                Elevate retention with viral keyword detection, animated reaction emojis, multi-language translation, and hook enhancers.
              </p>

              <button
                onClick={onTriggerAutoCaptionModal}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Run Full Auto-Captioner</span>
              </button>
            </div>

            {/* AI Action Cards */}
            <div className="space-y-2.5">
              {/* Emojis Injector */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-400/50 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-bold text-white">Add Viral Emojis</span>
                  </div>
                  <span className="text-[10px] font-bold text-yellow-300 bg-yellow-400/10 px-1.5 py-0.5 rounded-full border border-yellow-400/20">
                    🔥 🚀 💡
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mb-2.5">
                  Injects punchy contextual emojis at key punchlines to boost TikTok retention.
                </p>
                <button
                  onClick={() => onEnhanceWithAI('emojis')}
                  disabled={isAILoading || captions.length === 0}
                  className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 transition-all disabled:opacity-50"
                >
                  {isAILoading ? 'Enhancing with AI...' : 'Inject Smart Emojis'}
                </button>
              </div>

              {/* Keyword Highlighter */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-400/50 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Auto-Highlight Power Words</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-400/10 px-1.5 py-0.5 rounded-full border border-emerald-400/20">
                    10x, Secret
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mb-2.5">
                  Identifies numbers, action verbs, and triggers to colorize with secondary highlight.
                </p>
                <button
                  onClick={() => onEnhanceWithAI('keywords')}
                  disabled={isAILoading || captions.length === 0}
                  className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 transition-all disabled:opacity-50"
                >
                  {isAILoading ? 'Analyzing...' : 'Highlight Viral Keywords'}
                </button>
              </div>

              {/* Translation */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-400/50 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">AI Language Translation</span>
                  </div>
                  <Languages className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-[11px] text-white/50 mb-2">
                  Translate all subtitle chunks while preserving exact timing.
                </p>
                <div className="flex gap-2">
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 text-xs text-white px-2.5 py-1 rounded-xl outline-none"
                  >
                    <option value="Spanish" className="bg-[#0A0B14]">Spanish (Español)</option>
                    <option value="French" className="bg-[#0A0B14]">French (Français)</option>
                    <option value="German" className="bg-[#0A0B14]">German (Deutsch)</option>
                    <option value="Hindi" className="bg-[#0A0B14]">Hindi (हिंदी)</option>
                    <option value="Japanese" className="bg-[#0A0B14]">Japanese (日本語)</option>
                    <option value="Portuguese" className="bg-[#0A0B14]">Portuguese (Português)</option>
                    <option value="Italian" className="bg-[#0A0B14]">Italian (Italiano)</option>
                    <option value="Arabic" className="bg-[#0A0B14]">Arabic (العربية)</option>
                  </select>
                  <button
                    onClick={() => onEnhanceWithAI('translate')}
                    disabled={isAILoading || captions.length === 0}
                    className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    Translate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STYLE CUSTOMIZER */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-white/50">
              Typography & Color
            </span>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Font Family</label>
              <select
                value={style.fontFamily}
                onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-medium outline-none focus:border-purple-400"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-[#0A0B14]">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Position Y */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-white/70">
                  <span>Size</span>
                  <span className="font-mono text-purple-300">{style.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="72"
                  value={style.fontSize}
                  onChange={(e) => onUpdateStyle({ fontSize: Number(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-white/70">
                  <span>Position Y</span>
                  <span className="font-mono text-purple-300">{style.posPctY}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="85"
                  value={style.posPctY}
                  onChange={(e) => onUpdateStyle({ posPctY: Number(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Position Y Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Quick Position</label>
              <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => onUpdateStyle({ posPctY: 22 })}
                  className={`py-1 rounded-lg text-xs font-medium transition-all ${
                    style.posPctY <= 30 ? 'bg-white/20 text-white shadow-sm' : 'text-white/50'
                  }`}
                >
                  Top
                </button>
                <button
                  onClick={() => onUpdateStyle({ posPctY: 50 })}
                  className={`py-1 rounded-lg text-xs font-medium transition-all ${
                    style.posPctY > 30 && style.posPctY < 70
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/50'
                  }`}
                >
                  Center
                </button>
                <button
                  onClick={() => onUpdateStyle({ posPctY: 78 })}
                  className={`py-1 rounded-lg text-xs font-medium transition-all ${
                    style.posPctY >= 70 ? 'bg-white/20 text-white shadow-sm' : 'text-white/50'
                  }`}
                >
                  Bottom
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-xs font-semibold text-white/70">
                Active Word Highlight Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    onClick={() => onUpdateStyle({ highlightColor: color })}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      style.highlightColor === color
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-transparent hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Text Transform */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Letter Casing</label>
              <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => onUpdateStyle({ textTransform: 'uppercase' })}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    style.textTransform === 'uppercase'
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/50'
                  }`}
                >
                  UPPER
                </button>
                <button
                  onClick={() => onUpdateStyle({ textTransform: 'capitalize' })}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    style.textTransform === 'capitalize'
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/50'
                  }`}
                >
                  Title
                </button>
                <button
                  onClick={() => onUpdateStyle({ textTransform: 'none' })}
                  className={`py-1 rounded-lg text-xs font-bold transition-all ${
                    style.textTransform === 'none'
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/50'
                  }`}
                >
                  Normal
                </button>
              </div>
            </div>

            {/* Word Animation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Word Animation</label>
              <select
                value={style.animation}
                onChange={(e) => onUpdateStyle({ animation: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-medium outline-none focus:border-purple-400"
              >
                <option value="bounce" className="bg-[#0A0B14]">⚡ Pop & Bounce (Hormozi / Viral)</option>
                <option value="pop" className="bg-[#0A0B14]">🎯 Scale Pop (MrBeast)</option>
                <option value="glow" className="bg-[#0A0B14]">✨ Neon Pulse Glow</option>
                <option value="fade" className="bg-[#0A0B14]">🌊 Smooth Fade (Minimal)</option>
                <option value="glitch" className="bg-[#0A0B14]">📼 90s Retro Glitch</option>
                <option value="none" className="bg-[#0A0B14]">⏹️ Static (No motion)</option>
              </select>
            </div>

            {/* Stroke Width & Shadow */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-white/70">
                  <span>Stroke</span>
                  <span className="font-mono text-purple-300">{style.outlineWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={style.outlineWidth}
                  onChange={(e) => onUpdateStyle({ outlineWidth: Number(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-white/70">
                  <span>Shadow</span>
                  <span className="font-mono text-purple-300">{style.shadowBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={style.shadowBlur}
                  onChange={(e) => onUpdateStyle({ shadowBlur: Number(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MEDIA & STOCK */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-white/50">
              Stock Video Library
            </span>
            <p className="text-[11px] text-white/50">
              Select a sample talking head video to test captions immediately.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {STOCK_VIDEOS.map((stock) => (
                <div
                  key={stock.id}
                  onClick={() => onSelectStockVideo(stock)}
                  className="group relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden cursor-pointer hover:border-purple-400/80 transition-all shadow-md"
                >
                  <img
                    src={stock.thumbnail}
                    alt={stock.title}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2">
                    <span className="text-[11px] font-bold text-white line-clamp-1">
                      {stock.title}
                    </span>
                    <div className="flex items-center justify-between text-[9px] text-white/60 mt-0.5">
                      <span>{stock.category}</span>
                      <span className="font-mono">{stock.duration}s</span>
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Scripts */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                Viral Demo Scripts
              </span>
              <div className="space-y-1.5">
                {DEMO_SCRIPTS.map((demo, dIdx) => (
                  <div
                    key={dIdx}
                    onClick={() => onApplyDemoScript(demo.text)}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 cursor-pointer transition-all"
                  >
                    <div className="text-xs font-bold text-white mb-0.5 flex items-center justify-between">
                      <span>{demo.title}</span>
                      <span className="text-[10px] text-purple-300">Apply &rarr;</span>
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-2">{demo.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Safe Zone Toggle */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">TikTok / IG Safe Zone</span>
                <span className="text-[10px] text-white/50 block">
                  Show platform UI overlay to prevent caption clipping
                </span>
              </div>
              <input
                type="checkbox"
                checked={style.showSafeZone}
                onChange={(e) => onUpdateStyle({ showSafeZone: e.target.checked })}
                className="w-4 h-4 accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
