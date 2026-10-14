import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.maximizeWindow) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div
      className="col-span-2 h-8 w-full bg-[#0B0B0C] flex items-center justify-between px-3 z-50 select-none app-drag"
      aria-label="Title Bar"
    >
      {/* Kiri: Nama aplikasi 12px --text-muted #8D8D93 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-normal text-[#8D8D93] tracking-normal">
          AuraAudio
        </span>
      </div>

      {/* Kanan: Tombol kontrol jendela (minimize, maximize, close) */}
      <div className="flex items-center app-no-drag">
        <button
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
          aria-label="Minimalkan"
          title="Minimalkan"
        >
          <Minus size={14} strokeWidth={1.8} />
        </button>

        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
          aria-label="Maksimalkan"
          title="Maksimalkan"
        >
          <Square size={12} strokeWidth={1.8} />
        </button>

        <button
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center text-[#8D8D93] hover:text-white hover:bg-[#E07A7A] transition-colors cursor-pointer"
          aria-label="Tutup"
          title="Tutup"
        >
          <X size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};
