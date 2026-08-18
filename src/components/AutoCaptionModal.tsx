import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  FileText,
  Zap,
  Loader2,
  Wand2,
} from 'lucide-react';
import { DEMO_SCRIPTS } from '../constants/stockVideos';
import { startBrowserSpeechRecognition } from '../utils/audioExtractor';

interface AutoCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateFromScript: (
    script: string,
    wpc: number,
    tone: string,
    lang: string
  ) => Promise<void>;
  onGenerateFromSpeech: (transcript: string) => void;
  videoDuration: number;
  isLoading: boolean;
}

export const AutoCaptionModal: React.FC<AutoCaptionModalProps> = ({
  isOpen,
  onClose,
  onGenerateFromScript,
  onGenerateFromSpeech: _onGenerateFromSpeech,
  videoDuration,
  isLoading,
}) => {
  const [activeMode, setActiveMode] = useState<'script' | 'mic' | 'ai-topic'>('script');
  const [scriptText, setScriptText] = useState(
    'Nobody tells you the first ten minutes of starting a business is just staring at a blank screen. The secret is taking one messy action before you feel ready.'
  );
  const [topicPrompt, setTopicPrompt] = useState('How to build high performance daily habits');
  const [wordsPerCaption, setWordsPerCaption] = useState<number>(3);
  const [tone, setTone] = useState<string>('Alex Hormozi Viral');
  const [language, setLanguage] = useState<string>('English');

  // Mic speech dictation state
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [isGeneratingAITopic, setIsGeneratingAITopic] = useState(false);

  if (!isOpen) return null;

  const handleStartMic = () => {
    try {
      const recog = startBrowserSpeechRecognition(
        (transcript, isFinal) => {
          setMicTranscript((prev) => (isFinal ? `${prev} ${transcript}`.trim() : transcript));
        },
        (err) => {
          console.error('Speech recognition error:', err);
          setIsRecordingMic(false);
        }
      );
      setRecognitionInstance(recog);
      setIsRecordingMic(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopMic = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsRecordingMic(false);
    if (micTranscript.trim()) {
      setScriptText(micTranscript.trim());
      setActiveMode('script');
    }
  };

  const handleGenerateAITopic = async () => {
    setIsGeneratingAITopic(true);
    try {
      const res = await fetch('/api/ai/enhance-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicPrompt,
          targetTone: tone,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.optimizedScript) {
        setScriptText(data.data.optimizedScript);
        setActiveMode('script');
      }
    } catch (err) {
      console.error('Error generating AI script:', err);
    } finally {
      setIsGeneratingAITopic(false);
    }
  };

  const handleSubmit = async () => {
    if (!scriptText.trim()) return;
    await onGenerateFromScript(scriptText, wordsPerCaption, tone, language);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="bg-[#0A0B14]/85 border border-white/15 backdrop-blur-2xl rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Auto-Caption AI Studio
              </h3>
              <p className="text-xs text-white/50">
                Generate viral, synchronized word-by-word subtitles with Gemini AI
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

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-white/10 bg-white/[0.02] p-1.5 gap-1.5">
          <button
            onClick={() => setActiveMode('script')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeMode === 'script'
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Script & Presets</span>
          </button>

          <button
            onClick={() => setActiveMode('mic')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeMode === 'mic'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Live Voice Record</span>
          </button>

          <button
            onClick={() => setActiveMode('ai-topic')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeMode === 'ai-topic'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Script Writer</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* SCRIPT MODE */}
          {activeMode === 'script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/70">Spoken Words / Script</label>
                <div className="flex gap-1.5">
                  {DEMO_SCRIPTS.slice(0, 2).map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setScriptText(d.text)}
                      className="text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full transition-all"
                    >
                      {d.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={4}
                placeholder="Paste the words spoken in your video..."
                className="w-full bg-black/40 border border-white/10 focus:border-purple-400 text-xs text-white p-3 rounded-2xl outline-none resize-none font-medium leading-relaxed"
              />
            </div>
          )}

          {/* MIC MODE */}
          {activeMode === 'mic' && (
            <div className="py-4 text-center space-y-3">
              <div
                onClick={isRecordingMic ? handleStopMic : handleStartMic}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center cursor-pointer transition-all shadow-xl ${
                  isRecordingMic
                    ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-500/20'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {isRecordingMic ? (
                  <MicOff className="w-7 h-7" />
                ) : (
                  <Mic className="w-7 h-7" />
                )}
              </div>
              <h4 className="text-sm font-bold text-white">
                {isRecordingMic ? 'Listening to speech... Speak now!' : 'Click to start recording voice'}
              </h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                Uses browser speech-to-text to transcribe your voice live.
              </p>

              {micTranscript && (
                <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-xs text-white/90 text-left font-mono">
                  {micTranscript}
                </div>
              )}
            </div>
          )}

          {/* AI TOPIC WRITER */}
          {activeMode === 'ai-topic' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-white/70">
                What is your short video about?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder="e.g., 3 productivity hacks for developers"
                  className="flex-1 bg-black/40 border border-white/10 focus:border-purple-400 text-xs text-white px-3 py-2 rounded-xl outline-none"
                />
                <button
                  onClick={handleGenerateAITopic}
                  disabled={isGeneratingAITopic || !topicPrompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isGeneratingAITopic ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  <span>Write Script</span>
                </button>
              </div>
            </div>
          )}

          {/* Customization Options */}
          <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-3 text-xs">
            {/* Words Per Caption */}
            <div className="space-y-1">
              <label className="font-semibold text-white/70">Words / Chunk</label>
              <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                {[1, 2, 3, 5].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWordsPerCaption(w)}
                    className={`py-1 rounded-lg font-bold text-[11px] transition-all ${
                      wordsPerCaption === w
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Creator Tone */}
            <div className="space-y-1">
              <label className="font-semibold text-white/70">Viral Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-xs text-white p-2 rounded-xl outline-none"
              >
                <option value="Alex Hormozi Viral" className="bg-[#0A0B14]">Alex Hormozi (Fast & Punchy)</option>
                <option value="MrBeast High Energy" className="bg-[#0A0B14]">MrBeast (High Energy)</option>
                <option value="Ali Abdaal Clean" className="bg-[#0A0B14]">Ali Abdaal (Educational Calm)</option>
                <option value="Iman Gadzhi Story" className="bg-[#0A0B14]">Iman Gadzhi (Luxury Story)</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1">
              <label className="font-semibold text-white/70">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-xs text-white p-2 rounded-xl outline-none"
              >
                <option value="English" className="bg-[#0A0B14]">English</option>
                <option value="Spanish" className="bg-[#0A0B14]">Spanish</option>
                <option value="French" className="bg-[#0A0B14]">French</option>
                <option value="German" className="bg-[#0A0B14]">German</option>
                <option value="Hindi" className="bg-[#0A0B14]">Hindi</option>
                <option value="Japanese" className="bg-[#0A0B14]">Japanese</option>
                <option value="Portuguese" className="bg-[#0A0B14]">Portuguese</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="text-xs text-white/50">
            Target Video Time: <span className="font-mono text-purple-300">{videoDuration.toFixed(1)}s</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={isLoading || !scriptText.trim()}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 active:scale-95 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Captions...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Generate Subtitles</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
