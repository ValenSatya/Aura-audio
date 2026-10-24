import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Loader2,
  Play,
  Music,
  ArrowLeft,
  Home,
  Radio,
  Settings,
  Sliders,
} from 'lucide-react';
import { UserProfile, Track, YTMusicTrackItem } from '../types/music';

interface TopBarProps {
  activeView: 'ytmusic' | 'library' | 'custom_playlist' | 'stage';
  onViewChange: (view: 'ytmusic' | 'library' | 'custom_playlist' | 'stage') => void;
  ytSubTab?: 'liked' | 'playlists' | 'search';
  onYtSubTabChange?: (tab: 'liked' | 'playlists' | 'search') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userProfile: UserProfile;
  onOpenAuthModal: () => void;
  onOpenSettings?: () => void;
  onOpenEqualizer?: () => void;
  onHistoryBack?: () => void;
  canGoBack?: boolean;
  onPlayTrack?: (track: Track) => void;
  titleOverride?: string;
  onSearchSubmit?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onViewChange,
  ytSubTab = 'playlists',
  onYtSubTabChange,
  searchQuery,
  onSearchChange,
  userProfile,
  onOpenAuthModal,
  onOpenSettings,
  onOpenEqualizer,
  onHistoryBack,
  canGoBack = false,
  onPlayTrack,
  onSearchSubmit,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [quickSongs, setQuickSongs] = useState<YTMusicTrackItem[]>([]);
  const [isLoadingQuick, setIsLoadingQuick] = useState(false);
  const searchSeqRef = useRef(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for quick dropdown
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || !isDropdownOpen) {
      if (!trimmed) setQuickSongs([]);
      setIsLoadingQuick(false);
      return;
    }

    setIsLoadingQuick(true);
    const seq = ++searchSeqRef.current;

    const timer = setTimeout(async () => {
      try {
        if (window.electronAPI?.searchYouTubeMusic) {
          const res = await window.electronAPI.searchYouTubeMusic(trimmed);
          if (seq === searchSeqRef.current) {
            setQuickSongs((res || []).slice(0, 6));
          }
        }
      } catch (err) {
        if (seq === searchSeqRef.current) {
          setQuickSongs([]);
        }
      } finally {
        if (seq === searchSeqRef.current) {
          setIsLoadingQuick(false);
        }
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery, isDropdownOpen]);

  const isNestedPage = activeView === 'custom_playlist' || canGoBack;

  return (
    <header className="h-14 px-4 flex items-center justify-between gap-4 flex-shrink-0 z-30 select-none border-b border-white/[0.08] bg-[#121215]">
      {/* KIRI: Logo AuraAudio, Back Button, Nav Pills (Beranda & Stage) */}
      <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
        {/* Brand Logo */}
        <div
          onClick={() => {
            onViewChange('ytmusic');
            onYtSubTabChange?.('playlists');
          }}
          className="flex items-center gap-2.5 cursor-pointer group py-1"
          title="AuraAudio Beranda"
        >
          <div className="w-8 h-8 rounded-[8px] bg-white/10 border border-white/10 flex flex-col items-center justify-center gap-1 group-hover:scale-105 transition-transform">
            <div className="w-3.5 h-1 rounded-full bg-white/40" />
            <div className="w-3.5 h-1 rounded-full bg-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">AuraAudio</span>
        </div>

        {/* Back Button if inside a playlist/album */}
        {isNestedPage && onHistoryBack && (
          <button
            onClick={onHistoryBack}
            className="w-8 h-8 rounded-[8px] bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border border-white/5 active:scale-95"
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </button>
        )}

        {/* Top Navbar Pills */}
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => {
              onViewChange('ytmusic');
              onYtSubTabChange?.('playlists');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'ytmusic' && ytSubTab === 'playlists'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home size={15} strokeWidth={2} />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => onViewChange('stage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'stage'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio size={15} strokeWidth={2} />
            <span>Panggung</span>
          </button>
        </div>
      </div>

      {/* TENGAH: Search Capsule Input */}
      <div className="flex-1 max-w-md lg:max-w-lg mx-2 flex justify-center">
        <div ref={searchContainerRef} className="relative w-full">
          <div className="w-full h-9 rounded-full bg-[#18181D] hover:bg-[#202026] focus-within:bg-[#202026] border border-white/[0.08] focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20 flex items-center px-3.5 gap-2.5 transition-all">
            <Search size={15} strokeWidth={2} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim()) setIsDropdownOpen(true);
              }}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (e.target.value.trim()) setIsDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = searchQuery.trim();
                  if (trimmed) {
                    setIsDropdownOpen(false);
                    if (onSearchSubmit) {
                      onSearchSubmit(trimmed);
                    } else {
                      onViewChange('ytmusic');
                      onYtSubTabChange?.('search');
                    }
                  }
                } else if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                }
              }}
              placeholder="Cari lagu, artis, atau album..."
              className="bg-transparent text-xs font-medium text-white placeholder-zinc-400 focus:outline-none focus:ring-0 focus:shadow-none outline-none border-none shadow-none w-full"
            />
            {isLoadingQuick && (
              <Loader2 size={13} className="animate-spin text-zinc-400 flex-shrink-0" />
            )}
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Quick Submenu Dropdown */}
          {isDropdownOpen && searchQuery.trim() && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#18181D] border border-white/[0.08] rounded-[16px] shadow-2xl p-2.5 z-50 animate-in fade-in duration-120">
              <div className="px-3 py-1.5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Hasil Terkait
                </span>
                {isLoadingQuick && <Loader2 size={13} className="animate-spin text-zinc-400" />}
              </div>

              <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
                {quickSongs.length > 0 ? (
                  quickSongs.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => {
                        if (onPlayTrack) {
                          onPlayTrack({
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                            duration: track.duration,
                            sourceType: 'youtube',
                            url: track.url,
                            thumbnailUrl: track.thumbnailUrl,
                            dateAdded: Date.now(),
                          });
                        }
                        setIsDropdownOpen(false);
                      }}
                      className="group flex items-center justify-between p-2 rounded-[10px] hover:bg-white/5 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="relative w-9 h-9 rounded-[6px] overflow-hidden bg-white/5 flex-shrink-0">
                          {track.thumbnailUrl ? (
                            <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Music size={15} strokeWidth={1.8} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play size={13} fill="currentColor" className="text-white translate-x-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate transition-colors">
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : !isLoadingQuick ? (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    Tidak ada lagu ditemukan.
                  </div>
                ) : null}

                {searchQuery.trim() && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onSearchSubmit) onSearchSubmit(searchQuery.trim());
                      else {
                        onViewChange('ytmusic');
                        onYtSubTabChange?.('search');
                      }
                    }}
                    className="w-full mt-1.5 p-2 text-center text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 rounded-[8px] transition-colors cursor-pointer"
                  >
                    Buka hasil pencarian lengkap untuk "{searchQuery.trim()}" →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KANAN: EQ, Settings & User Avatar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onOpenEqualizer && (
          <button
            onClick={onOpenEqualizer}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5"
            title="Equalizer 8-Band"
            aria-label="Equalizer"
          >
            <Sliders size={16} strokeWidth={1.8} />
          </button>
        )}

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5"
            title="Pengaturan"
            aria-label="Pengaturan"
          >
            <Settings size={16} strokeWidth={1.8} />
          </button>
        )}

        {/* User Avatar */}
        <button
          onClick={onOpenAuthModal}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden transition-all hover:scale-105 active:scale-95 border border-white/10"
          aria-label={userProfile?.isLoggedIn ? userProfile.name || 'Profil Pengguna' : 'Masuk Akun'}
          title={userProfile?.isLoggedIn ? userProfile.name || 'Profil Kamu' : 'Masuk Akun'}
        >
          {userProfile?.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span>
              {(userProfile?.name || userProfile?.username || 'U').slice(0, 1).toUpperCase()}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
