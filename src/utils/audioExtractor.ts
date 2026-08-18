/**
 * Extracts audio track from video file into base64 audio (WAV / MP3)
 */
export async function extractAudioFromVideo(
  videoFile: File,
  maxDurationSeconds: number = 60
): Promise<{ base64: string; mimeType: string; duration: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

        const duration = Math.min(decodedBuffer.duration, maxDurationSeconds);
        const sampleRate = 16000; // 16kHz is ideal for AI speech recognition
        const numChannels = 1; // mono

        const offlineCtx = new OfflineAudioContext(numChannels, sampleRate * duration, sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = decodedBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);

        const renderedBuffer = await offlineCtx.startRendering();
        const wavBlob = audioBufferToWavBlob(renderedBuffer);

        const base64 = await blobToBase64(wavBlob);
        resolve({
          base64: base64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: 'audio/wav',
          duration,
        });
      } catch (err) {
        console.warn('Audio decoding fallback:', err);
        // Fallback: send raw slice
        resolve({
          base64: '',
          mimeType: 'video/mp4',
          duration: 0,
        });
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(videoFile);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAV container header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

/**
 * In-browser Web Speech API recognition fallback
 */
export function startBrowserSpeechRecognition(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (err: any) => void
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError(new Error('Web Speech API is not supported in this browser.'));
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    onResult(final || interim, Boolean(final));
  };

  recognition.onerror = (event: any) => {
    onError(event.error);
  };

  recognition.start();
  return recognition;
}
