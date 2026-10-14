import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  barCount?: number;
  height?: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  analyserNode,
  isPlaying,
  barCount = 36,
  height = 64,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationId = requestAnimationFrame(render);

      const width = canvas.width;
      const canvasHeight = canvas.height;

      ctx.clearRect(0, 0, width, canvasHeight);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Subtle idle breathing pulse
        const time = Date.now() / 800;
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(time + i * 0.15) * 8 + 12;
        }
      }

      const totalBars = barCount;
      const barSpacing = 3;
      const barWidth = Math.max(2, (width - (totalBars - 1) * barSpacing) / totalBars);

      // Minimalist monochrome gradient for bars
      const gradient = ctx.createLinearGradient(0, canvasHeight, 0, 0);
      gradient.addColorStop(0, '#52525b'); // zinc-600
      gradient.addColorStop(0.6, '#d4d4d8'); // zinc-300
      gradient.addColorStop(1, '#ffffff'); // pure white

      for (let i = 0; i < totalBars; i++) {
        // Sample logarithmically to give better distribution across human hearing
        const sampleIndex = Math.floor(Math.pow(i / totalBars, 1.6) * (bufferLength / 2));
        const rawValue = dataArray[sampleIndex] || 0;
        const normalized = rawValue / 255;
        const barHeight = Math.max(3, normalized * canvasHeight);

        const x = i * (barWidth + barSpacing);
        const y = canvasHeight - barHeight;

        ctx.fillStyle = gradient;
        // Rounded bar cap
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, isPlaying, barCount]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
