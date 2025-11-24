import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (!isActive) return;

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      // Create a wave based on volume
      const amplitude = Math.max(5, volume * height * 0.8); 
      const frequency = 0.05;
      
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)'; // Purple-400
      ctx.lineWidth = 3;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency + offset) * amplitude * Math.sin(x / width * Math.PI);
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();

      // Second wave (offset)
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)'; // Pink-500
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency * 1.5 + offset + 2) * (amplitude * 0.7) * Math.sin(x / width * Math.PI);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += 0.15;
      animationId = requestAnimationFrame(draw);
    };

    if (isActive) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => cancelAnimationFrame(animationId);
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-24 rounded-lg opacity-90"
    />
  );
};
