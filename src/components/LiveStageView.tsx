import React, { useEffect, useRef } from 'react';
import { Track } from '../types/music';
import { useTrackCover } from '../utils/coverArt';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Download,
  Sliders,
  ListMusic,
  Radio,
  Sparkles,
  Music2,
  HardDrive,
  Cloud,
} from 'lucide-react';

interface LiveStageViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  analyserNode: AnalyserNode | null;
  upcomingTrack?: Track | null;
  onOpenEqualizer: () => void;
  onOpenQueue: () => void;
  onStartDownload?: (track: Track) => void;
  onOpenAddToPlaylist?: (track: Track) => void;
}

export const LiveStageView: React.FC<LiveStageViewProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrev,
  analyserNode,
  upcomingTrack,
  onOpenEqualizer,
  onOpenQueue,
  onStartDownload,
  onOpenAddToPlaylist,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const coverUrl = useTrackCover(
    currentTrack?.title || '',
    currentTrack?.artist || '',
    currentTrack?.thumbnailUrl
  );

  const upcomingCover = useTrackCover(
    upcomingTrack?.title || '',
    upcomingTrack?.artist || '',
    upcomingTrack?.thumbnailUrl
  );

  // Audio frequency visualizer on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);

    const renderVisualizer = () => {
      animationFrameRef.current = requestAnimationFrame(renderVisualizer);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Idle gentle breathing sine wave when paused
        const t = performance.now() * 0.002;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(8, Math.sin(t + i * 0.15) * 20 + 25);
        }
      }

      const barWidth = (width / bufferLength) * 0.7;
      let x = (width - (bufferLength * barWidth + (bufferLength - 1) * 3)) / 2;

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        const barHeight = Math.max(3, (val / 255) * height * 0.85);

        // Smooth subtle monochrome gradient
        const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
        grad.addColorStop(0, '#F4F4F0');
        grad.addColorStop(0.7, '#8D8D93');
        grad.addColorStop(1, '#1F1F23');

        ctx.fillStyle = grad;
        const y = height - barHeight;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();

        x += barWidth + 3;
      }
    };

    renderVisualizer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying]);

  return (
    <div className="h-full w-full overflow-y-auto select-none p-8 pb-32 flex flex-col justify-between font-['Sora']">
      {/* Top Stage Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#1F1F23] flex items-center justify-center text-[#F4F4F0]">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-['JetBrains_Mono'] tracking-widest text-[#8D8D93] uppercase">
              LIVE STUDIO STAGE
            </span>
            <p className="text-xs font-semibold text-[#F4F4F0]">Visualizer Audio & Akustik</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEqualizer}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-xs font-medium text-[#F4F4F0] transition-all cursor-pointer"
          >
            <Sliders size={13} className="text-[#8D8D93]" />
            <span>Equalizer & DSP</span>
          </button>
          <button
            onClick={onOpenQueue}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-xs font-medium text-[#F4F4F0] transition-all cursor-pointer"
          >
            <ListMusic size={13} className="text-[#8D8D93]" />
            <span>Antrean</span>
          </button>
        </div>
      </div>

      {/* Main Center Stage: Vinyl Turntable & High-Res Spotlight */}
      <div className="my-auto py-8 flex flex-col lg:flex-row items-center justify-center gap-12 max-w-5xl mx-auto w-full">
        {/* Interactive Vinyl + Sleeve Display */}
        <div className="relative group flex items-center justify-center flex-shrink-0">
          {/* Vinyl Disc that slides out and spins */}
          <div
            className={`w-64 h-64 md:w-72 md:h-72 rounded-full absolute transition-all duration-700 ease-out flex items-center justify-center shadow-2xl ${
              isPlaying
                ? 'translate-x-20 md:translate-x-28 rotate-180'
                : 'translate-x-8 md:translate-x-12 rotate-45'
            }`}
            style={{
              background: 'radial-gradient(circle, #09090b 28%, #18181b 30%, #09090b 45%, #27272a 48%, #09090b 65%, #18181b 68%, #09090b 100%)',
              animation: isPlaying ? 'spin 18s linear infinite' : 'none',
            }}
          >
            {/* Center Vinyl Label with miniature artwork */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center relative shadow-inner">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="vinyl center"
                  className="w-full h-full object-cover opacity-80"
                />
              ) : (
                <DiscIcon size={32} className="text-zinc-600" />
              )}
              {/* Spindle hole */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#0e0e10] absolute shadow-lg" />
            </div>
          </div>

          {/* Sleeve Jacket Artwork */}
          <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-[10px] overflow-hidden bg-[#17171A] shadow-2xl z-10 flex-shrink-0 group-hover:scale-[1.02] transition-transform duration-300">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={currentTrack?.title || 'Sleeve'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#17171A]">
                <Music2 size={64} className="text-[#8E8E93]" />
              </div>
            )}

            {/* Offline/Online Badge */}
            {currentTrack && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-[4px] bg-[#0B0B0C]/80 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-['JetBrains_Mono'] text-[#F4F4F0]">
                {currentTrack.isOffline ? (
                  <>
                    <HardDrive size={11} className="text-[#8D8D93]" />
                    <span>Offline</span>
                  </>
                ) : (
                  <>
                    <Cloud size={11} className="text-[#8D8D93]" />
                    <span>48kHz Stream</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Track Editorial Info & Controls */}
        <div className="flex-1 min-w-0 max-w-md text-center lg:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-[#1F1F23] text-[#F4F4F0] text-[10px] font-['JetBrains_Mono']">
            <Sparkles size={11} />
            <span>STUDIO FIDELITY PLAYBACK</span>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#F4F4F0] tracking-tight truncate">
              {currentTrack ? currentTrack.title : 'Tidak ada lagu yang diputar'}
            </h2>
            <p className="text-sm font-normal text-[#8D8D93] mt-1 truncate">
              {currentTrack ? currentTrack.artist : 'Pilih lagu dari beranda atau antrean'}
            </p>
          </div>

          {/* Real-time Spectrum Visualizer Canvas */}
          <div className="pt-2">
            <canvas
              ref={canvasRef}
              width={340}
              height={50}
              className="w-full max-w-[340px] h-[50px] mx-auto lg:mx-0 opacity-90"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-center lg:justify-start gap-2 pt-2">
            {currentTrack && onOpenAddToPlaylist && (
              <button
                onClick={() => onOpenAddToPlaylist(currentTrack)}
                className="w-10 h-10 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] flex items-center justify-center transition-all cursor-pointer"
                title="Tambah ke Playlist"
              >
                <Plus size={16} />
              </button>
            )}

            {currentTrack && onStartDownload && !currentTrack.isOffline && (
              <button
                onClick={() => onStartDownload(currentTrack)}
                className="w-10 h-10 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] flex items-center justify-center transition-all cursor-pointer"
                title="Unduh untuk Diputar Offline"
              >
                <Download size={16} />
              </button>
            )}

            {/* Quick Play/Pause Control on Stage */}
            <button
              onClick={onPrev}
              disabled={!currentTrack}
              className="w-10 h-10 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer"
              title="Lagu Sebelumnya"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              className="w-12 h-12 rounded-full bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] flex items-center justify-center shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 cursor-pointer"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!currentTrack}
              className="w-10 h-10 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer"
              title="Lagu Selanjutnya"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Stage Deck: Upcoming in Queue Teaser */}
      {upcomingTrack && (
        <div className="max-w-xl mx-auto w-full bg-[#17171A] rounded-[10px] p-3.5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[6px] overflow-hidden bg-[#0B0B0C] flex-shrink-0">
              {upcomingCover ? (
                <img
                  src={upcomingCover}
                  alt={upcomingTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music2 size={16} className="text-[#8D8D93] m-3" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#8D8D93] uppercase tracking-wider block">
                SELANJUTNYA DALAM ANTREAN
              </span>
              <p className="text-xs font-semibold text-[#F4F4F0] truncate">{upcomingTrack.title}</p>
              <p className="text-[11px] text-[#8D8D93] truncate">{upcomingTrack.artist}</p>
            </div>
          </div>

          <button
            onClick={onNext}
            className="px-3.5 py-2 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-xs font-medium text-[#F4F4F0] transition-all flex-shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Lewati ke Lagu Ini</span>
            <SkipForward size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

function DiscIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
