import { CaptionItem, CaptionTemplate, StyleSettings } from '../types';

export interface RenderOptions {
  videoElement: HTMLVideoElement;
  captions: CaptionItem[];
  template: CaptionTemplate;
  style: StyleSettings;
  duration: number;
  width: number;
  height: number;
  fps?: number;
  onProgress?: (percent: number) => void;
}

/**
 * Render captions onto a 2D canvas context at a specific timestamp
 */
export function drawCaptionsToCanvas(
  ctx: CanvasRenderingContext2D,
  time: number,
  captions: CaptionItem[],
  template: CaptionTemplate,
  style: StyleSettings,
  canvasWidth: number,
  canvasHeight: number
) {
  const activeCaption = captions.find((c) => time >= c.start && time <= c.end);
  if (!activeCaption) return;

  const words = activeCaption.text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  // Calculate active word based on sub-timing
  const captionDuration = Math.max(0.1, activeCaption.end - activeCaption.start);
  const timeInCap = Math.max(0, time - activeCaption.start);
  const wordDuration = captionDuration / words.length;
  const activeWordIndex = Math.min(words.length - 1, Math.floor(timeInCap / wordDuration));

  // Scale font size based on canvas width (normalized to 360px preview width)
  const scaleRatio = canvasWidth / 360;
  const fontSizePx = Math.round(style.fontSize * scaleRatio);
  const fontFam = style.fontFamily || template.fontFamily;
  const isItalic = template.italic ? 'italic ' : '';
  const fontWeight = style.fontWeight || template.fontWeight || 700;

  ctx.font = `${isItalic}${fontWeight} ${fontSizePx}px ${fontFam}`;
  ctx.textBaseline = 'middle';

  // Apply text transformation
  const displayWords = words.map((w) => {
    if (style.textTransform === 'uppercase') return w.toUpperCase();
    if (style.textTransform === 'lowercase') return w.toLowerCase();
    if (style.textTransform === 'capitalize') {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    return w;
  });

  const fullDisplayWords = style.showEmojis && activeCaption.emoji
    ? [...displayWords, activeCaption.emoji]
    : displayWords;

  // Measure word widths and spacing
  const spaceWidth = ctx.measureText(' ').width;
  const wordWidths = fullDisplayWords.map((w) => ctx.measureText(w).width);
  const totalTextWidth = wordWidths.reduce((acc, w) => acc + w, 0) + spaceWidth * (fullDisplayWords.length - 1);

  // Position
  const posY = canvasHeight * (style.posPctY / 100);
  let startX = (canvasWidth - totalTextWidth) / 2;
  if (style.posAlignX === 'left') {
    startX = canvasWidth * 0.08;
  } else if (style.posAlignX === 'right') {
    startX = canvasWidth * 0.92 - totalTextWidth;
  }

  // Draw background box if enabled
  if (template.boxPerPhrase && style.bgColor && style.bgColor !== 'rgba(0, 0, 0, 0)') {
    const padX = style.bgPadding * scaleRatio * 1.5;
    const padY = style.bgPadding * scaleRatio * 1.1;
    const boxX = startX - padX;
    const boxY = posY - fontSizePx * 0.65 - padY;
    const boxW = totalTextWidth + padX * 2;
    const boxH = fontSizePx * 1.3 + padY * 2;
    const radius = style.borderRadius * scaleRatio;

    ctx.save();
    ctx.fillStyle = style.bgColor;
    ctx.globalAlpha = style.bgOpacity ?? 1;

    // Rounded rectangle path
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.fill();
    ctx.restore();
  }

  // Draw each word
  let curX = startX;
  fullDisplayWords.forEach((word, idx) => {
    const wWidth = wordWidths[idx];
    const isActive = idx === activeWordIndex;
    const isEmoji = idx === displayWords.length && activeCaption.emoji;

    ctx.save();

    // Determine colors
    let wordColor = style.textColor || template.textColor || '#FFFFFF';
    if (isActive) {
      wordColor = style.highlightColor || template.highlightColor || '#FFDF00';
    } else if (
      activeCaption.highlightWords &&
      activeCaption.highlightWords.some((hw) => hw.toLowerCase() === word.toLowerCase())
    ) {
      wordColor = style.secondaryColor || template.secondaryColor || '#38BDF8';
    }

    // Word background pill if boxPerWord
    if (template.boxPerWord && isActive) {
      const padX = 8 * scaleRatio;
      const padY = 4 * scaleRatio;
      ctx.fillStyle = style.highlightColor;
      ctx.beginPath();
      ctx.roundRect(
        curX - padX,
        posY - fontSizePx * 0.6 - padY,
        wWidth + padX * 2,
        fontSizePx * 1.2 + padY * 2,
        999
      );
      ctx.fill();
      wordColor = '#000000';
    }

    // Shadow / Glow
    if (style.shadowBlur > 0 || template.glow) {
      ctx.shadowColor = template.glow ? (isActive ? style.highlightColor : style.shadowColor) : style.shadowColor;
      ctx.shadowBlur = (style.shadowBlur || 10) * scaleRatio;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scaleRatio;
    }

    // Text Outline / Stroke
    if (style.outlineWidth > 0) {
      ctx.strokeStyle = style.outlineColor || '#000000';
      ctx.lineWidth = style.outlineWidth * scaleRatio * 1.2;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(word, curX, posY);
    }

    // Animation scale effect on active word
    if (isActive && (style.animation === 'pop' || style.animation === 'bounce') && !isEmoji) {
      const centerX = curX + wWidth / 2;
      const centerY = posY;
      ctx.translate(centerX, centerY);
      ctx.scale(1.08, 1.08);
      ctx.translate(-centerX, -centerY);
    }

    // Fill Text
    ctx.fillStyle = wordColor;
    ctx.fillText(word, curX, posY);

    // Glow underline effect
    if (template.id === 'glow-underline' && isActive) {
      ctx.strokeStyle = style.highlightColor;
      ctx.lineWidth = 4 * scaleRatio;
      ctx.beginPath();
      ctx.moveTo(curX, posY + fontSizePx * 0.65);
      ctx.lineTo(curX + wWidth, posY + fontSizePx * 0.65);
      ctx.stroke();
    }

    ctx.restore();
    curX += wWidth + spaceWidth;
  });
}

/**
 * High-quality Video Exporter with MediaRecorder
 */
export async function exportBurnedVideo(options: RenderOptions): Promise<Blob> {
  const { videoElement, captions, template, style, duration, width, height, fps = 30, onProgress } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Could not create canvas 2D rendering context');
      }

      const canvasStream = canvas.captureStream(fps);

      // Extract and merge audio track from video element if available
      let audioStream: MediaStream | null = null;
      try {
        if ((videoElement as any).captureStream) {
          audioStream = (videoElement as any).captureStream();
        } else if ((videoElement as any).mozCaptureStream) {
          audioStream = (videoElement as any).mozCaptureStream();
        }
      } catch (err) {
        console.warn('Could not capture audio stream from video element:', err);
      }

      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        combinedTracks.push(audioStream.getAudioTracks()[0]);
      }

      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6000000, // 6 Mbps high quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const outputBlob = new Blob(chunks, { type: mimeType });
        resolve(outputBlob);
      };

      // Rewind and prepare video
      videoElement.pause();
      videoElement.currentTime = 0;
      await new Promise((r) => {
        videoElement.onseeked = r;
      });

      recorder.start(100);
      videoElement.play();

      let animationFrameId: number;
      const renderLoop = () => {
        const curTime = videoElement.currentTime;

        // Draw video background with cover fit
        const vw = videoElement.videoWidth || width;
        const vh = videoElement.videoHeight || height;
        const scale = Math.max(width / vw, height / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (width - dw) / 2;
        const dy = (height - dh) / 2;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(videoElement, dx, dy, dw, dh);

        // Draw burned-in subtitle overlay
        drawCaptionsToCanvas(ctx, curTime, captions, template, style, width, height);

        if (onProgress) {
          const progress = Math.min(100, Math.round((curTime / Math.max(duration, 0.1)) * 100));
          onProgress(progress);
        }

        if (curTime < duration && !videoElement.paused && !videoElement.ended) {
          animationFrameId = requestAnimationFrame(renderLoop);
        }
      };

      animationFrameId = requestAnimationFrame(renderLoop);

      videoElement.onended = () => {
        cancelAnimationFrame(animationFrameId);
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      // Safety timeout in case onended doesn't fire
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, (duration + 3) * 1000);
    } catch (error) {
      reject(error);
    }
  });
}
