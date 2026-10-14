import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Loader2,
  Play,
  Music,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile, Track, YTMusicTrackItem } from '../types/music';

interface TopBarProps {
  activeView: 'ytmusic' | 'library' | 'custom_playlist' | 'stage';
  onViewChange: (view: 'ytmusic' | 'library' | 'custom_playlist' | 'stage') => void;
  ytSubTab?: 'liked' | 'playlists' | 'search';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userProfile: UserProfile;
  onOpenAuthModal: () => void;
  onHistoryBack?: () => void;
  canGoBack?: boolean;
  onPlayTrack?: (track: Track) => void;
  titleOverride?: string;
  onSearchSubmit?: (query: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onViewChange,
  ytSubTab = 'playlists',
  searchQuery,
  onSearchChange,
  userProfile,
  onOpenAuthModal,
  onHistoryBack,
  canGoBack = false,
  onPlayTrack,
  titleOverride,
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

  // Determine Title according to design.md Section 4.2 & 5
  let pageTitle = getGreeting();
  if (titleOverride) {
    pageTitle = titleOverride;
  } else if (activeView === 'ytmusic') {
    if (ytSubTab === 'search') pageTitle = 'Cari';
    else if (ytSubTab === 'liked') pageTitle = 'Disukai';
    else if (ytSubTab === 'playlists') pageTitle = getGreeting();
  } else if (activeView === 'library') {
    pageTitle = 'Pustaka';
  }

  const isNestedPage = activeView === 'custom_playlist' || canGoBack;

  return (
    <header className="pt-7 pb-4 px-9 flex items-center justify-between gap-6 flex-shrink-0 z-20 select-none">
      {/* 4.2 Kiri: Judul Display (54px, bobot 300, -1px letter-spacing) atau tombol kembali jika halaman bersarang */}
      <div className="flex items-center gap-4 min-w-0">
        {isNestedPage && onHistoryBack && (
          <button
            onClick={onHistoryBack}
            className="w-11 h-11 rounded-[8px] bg-[#17171A] hover:bg-[#1F1F23] text-[#F4F4F0] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            aria-label="Kembali"
            title="Kembali"
          >
            <ArrowLeft size={20} strokeWidth={1.8} />
          </button>
        )}
        <h1 className="text-[40px] font-light tracking-[-0.8px] text-[#F4F4F0] leading-none truncate">
          {pageTitle}
        </h1>
      </div>

      {/* 3.2 Kanan: Kolom pencarian (tinggi 44px, lebar 300px / 480px di Cari, latar --surface #17171A, radius 8px) dan avatar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div ref={searchContainerRef} className="relative">
          <div
            className={`${
              activeView === 'ytmusic' && ytSubTab === 'search' ? 'w-[480px]' : 'w-[300px]'
            } h-11 rounded-[8px] bg-[#17171A] hover:bg-[#1F1F23] focus-within:bg-[#1F1F23] flex items-center px-4 gap-3 transition-all`}
          >
            <Search size={18} strokeWidth={1.8} className="text-[#8D8D93] flex-shrink-0" />
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
                    }
                  }
                } else if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                }
              }}
              placeholder="Cari lagu, artis, atau album"
              className="bg-transparent text-sm font-normal text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none w-full"
            />
            {isLoadingQuick && (
              <Loader2 size={15} className="animate-spin text-[#8D8D93] flex-shrink-0" />
            )}
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
                className="p-1 rounded-[4px] text-[#8D8D93] hover:text-[#F4F4F0] transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            )}
          </div>

          {/* Quick Submenu Dropdown (floating with 0 12px 32px shadow, no borders) */}
          {isDropdownOpen && searchQuery.trim() && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-[360px] max-w-[90vw] bg-[#1F1F23] rounded-[8px] shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-2 z-50 animate-in fade-in duration-120">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-[#8D8D93] font-normal uppercase tracking-wider">
                  Hasil Terkait
                </span>
                {isLoadingQuick && <Loader2 size={13} className="animate-spin text-[#8D8D93]" />}
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
                      className="group flex items-center justify-between p-2 rounded-[6px] hover:bg-[#17171A] transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="relative w-10 h-10 rounded-[6px] overflow-hidden bg-[#17171A] flex-shrink-0">
                          {track.thumbnailUrl ? (
                            <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                              <Music size={16} strokeWidth={1.8} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play size={14} fill="currentColor" className="text-[#F4F4F0] translate-x-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-normal text-[#F4F4F0] truncate group-hover:text-white transition-colors">
                            {track.title}
                          </p>
                          <p className="text-xs font-normal text-[#8D8D93] truncate">{track.artist}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : !isLoadingQuick ? (
                  <div className="p-4 text-center text-xs text-[#8D8D93]">
                    Tidak ada lagu ditemukan.
                  </div>
                ) : null}

                {searchQuery.trim() && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onSearchSubmit) onSearchSubmit(searchQuery.trim());
                      else onViewChange('ytmusic');
                    }}
                    className="w-full mt-1.5 p-2 text-center text-xs font-medium text-[#F4F4F0] hover:bg-[#1F1F23] rounded-[6px] transition-colors cursor-pointer"
                  >
                    Buka hasil pencarian lengkap untuk "{searchQuery.trim()}" →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3.2 Avatar: 44x44 lingkaran, latar --surface-high #1F1F23, inisial bobot 600 warna --text #F4F4F0 */}
        <button
          onClick={onOpenAuthModal}
          className="w-11 h-11 rounded-full bg-[#1F1F23] text-[#F4F4F0] font-semibold text-base flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden transition-transform hover:scale-[1.03] active:scale-[0.97]"
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
