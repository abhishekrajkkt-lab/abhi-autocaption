/**
 * Generates an aesthetic animated background video (Blob URL)
 * if external sample video fails to load or is blocked by CORS/network.
 */
export function generateFallbackVideoBlob(aspectRatio: string = '9:16', durationSec: number = 15): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      let width = 720;
      let height = 1280;
      if (aspectRatio === '16:9') {
        width = 1280;
        height = 720;
      } else if (aspectRatio === '1:1') {
        width = 720;
        height = 720;
      } else if (aspectRatio === '4:5') {
        width = 720;
        height = 900;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      const stream = canvas.captureStream(30);
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      } catch (e) {
        try {
          mediaRecorder = new MediaRecorder(stream);
        } catch (err) {
          resolve('');
          return;
        }
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      mediaRecorder.start();

      let startTime = performance.now();
      const totalFrames = Math.min(durationSec * 30, 450); // up to 15s
      let frame = 0;

      function renderFrame() {
        const t = frame / 30;
        
        // Dynamic aesthetic gradient mesh
        const grad = ctx!.createRadialGradient(
          width / 2 + Math.sin(t * 0.8) * (width * 0.3),
          height / 2 + Math.cos(t * 0.8) * (height * 0.3),
          50,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.8
        );
        grad.addColorStop(0, '#3b1d60');
        grad.addColorStop(0.5, '#161938');
        grad.addColorStop(1, '#080912');

        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, width, height);

        // Floating ambient glowing particles
        for (let i = 0; i < 8; i++) {
          const px = (Math.sin(t * 0.5 + i * 1.2) * 0.5 + 0.5) * width;
          const py = (Math.cos(t * 0.7 + i * 1.5) * 0.5 + 0.5) * height;
          const radius = 60 + Math.sin(t + i) * 30;
          
          const pGrad = ctx!.createRadialGradient(px, py, 0, px, py, radius);
          pGrad.addColorStop(0, i % 2 === 0 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)');
          pGrad.addColorStop(1, 'transparent');
          
          ctx!.fillStyle = pGrad;
          ctx!.beginPath();
          ctx!.arc(px, py, radius, 0, Math.PI * 2);
          ctx!.fill();
        }

        // Creator silhouette avatar outline for realistic talking head preview
        ctx!.save();
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx!.beginPath();
        // Head
        ctx!.arc(width / 2, height * 0.42, width * 0.16, 0, Math.PI * 2);
        ctx!.fill();
        // Shoulders
        ctx!.beginPath();
        ctx!.ellipse(width / 2, height * 0.75, width * 0.36, height * 0.22, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();

        frame++;
        if (frame < totalFrames) {
          requestAnimationFrame(renderFrame);
        } else {
          mediaRecorder.stop();
        }
      }

      renderFrame();
    } catch (e) {
      console.error('Error generating fallback video blob:', e);
      resolve('');
    }
  });
}
