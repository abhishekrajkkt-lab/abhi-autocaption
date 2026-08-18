export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export interface CaptionWord {
  text: string;
  start: number;
  end: number;
  highlight?: boolean;
  color?: string;
}

export interface CaptionItem {
  id: string;
  text: string;
  start: number;
  end: number;
  highlightWords?: string[];
  emoji?: string;
  speaker?: string;
  customColor?: string;
}

export type AnimationType = 'pop' | 'bounce' | 'glow' | 'fade' | 'glitch' | 'none';
export type TextTransformType = 'none' | 'uppercase' | 'capitalize' | 'lowercase';
export type TemplateCategory = 'viral' | 'neon' | 'modern' | 'minimal' | 'retro' | 'creative';

export interface CaptionTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  fontFamily: string;
  fontWeight: number | string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  secondaryColor?: string;
  bgColor: string;
  bgPadding: number;
  borderRadius: number;
  textTransform: TextTransformType;
  outlineWidth: number;
  outlineColor: string;
  shadowBlur: number;
  shadowColor: string;
  animation: AnimationType;
  bionic?: boolean;
  glow?: boolean;
  italic?: boolean;
  boxPerPhrase?: boolean;
  boxPerWord?: boolean;
  badgeStyle?: boolean;
}

export interface StyleSettings {
  templateId: string;
  fontFamily: string;
  fontWeight: number | string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  secondaryColor: string;
  bgColor: string;
  bgOpacity: number;
  bgPadding: number;
  borderRadius: number;
  textTransform: TextTransformType;
  outlineWidth: number;
  outlineColor: string;
  shadowBlur: number;
  shadowColor: string;
  animation: AnimationType;
  posPctY: number; // 0 to 100%
  posAlignX: 'left' | 'center' | 'right';
  wordsPerCaption: number;
  showSafeZone: boolean;
  showEmojis: boolean;
  bionicReading: boolean;
  speakerColors: { [key: string]: string };
}

export interface StockVideo {
  id: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  aspectRatio: AspectRatio;
  duration: number;
  category: string;
}

export interface ExportConfig {
  resolution: '720p' | '1080p' | '4k';
  format: 'webm' | 'mp4';
  fps: 30 | 60;
  burnCaptions: boolean;
  includeAudio: boolean;
}
