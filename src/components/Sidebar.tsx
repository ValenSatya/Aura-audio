import React from 'react';
import { PlaylistFilter, Track, UserProfile, CustomPlaylist } from '../types/music';
import {
  Home,
  Search,
  Library,
  Heart,
  Download,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentFilter: PlaylistFilter;
  onFilterChange: (filter: PlaylistFilter) => void;
  tracks?: Track[];
  onOpenImportModal?: (tab?: 'youtube' | 'playlist' | 'local' | 'spotify') => void;
  userProfile?: UserProfile;
  onOpenAuthModal?: () => void;
  onOpenSettings?: () => void;
  activeView: 'ytmusic' | 'library' | 'custom_playlist' | 'stage';
  onViewChange: (view: 'ytmusic' | 'library' | 'custom_playlist' | 'stage') => void;
  ytSubTab: 'liked' | 'playlists' | 'search';
  onYtSubTabChange: (tab: 'liked' | 'playlists' | 'search') => void;
  customPlaylists?: CustomPlaylist[];
  activeCustomPlaylistId?: string | null;
  onSelectCustomPlaylist?: (id: string) => void;
  onOpenCreatePlaylist?: () => void;
  onDeleteCustomPlaylist?: (id: string) => void;
  onDownloadBatch?: (tracks: Track[]) => void;
  isQueueOpen?: boolean;
  onToggleQueue?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onFilterChange,
  activeView,
  onViewChange,
  ytSubTab,
  onYtSubTabChange,
  onOpenSettings,
}) => {
  // Navigation active state detectors according to design.md
  const isHomeActive = activeView === 'ytmusic' && ytSubTab === 'playlists';
  const isSearchActive = activeView === 'ytmusic' && ytSubTab === 'search';
  const isLibraryActive =
    (activeView === 'library' && currentFilter !== 'offline') ||
    activeView === 'custom_playlist';
  const isLikedActive = activeView === 'ytmusic' && ytSubTab === 'liked';
  const isDownloadsActive = activeView === 'library' && currentFilter === 'offline';

  const navItems = [
    {
      id: 'home',
      label: 'Beranda',
      icon: Home,
      isActive: isHomeActive,
      onClick: () => {
        onViewChange('ytmusic');
        onYtSubTabChange('playlists');
      },
    },
    {
      id: 'search',
      label: 'Cari',
      icon: Search,
      isActive: isSearchActive,
      onClick: () => {
        onViewChange('ytmusic');
        onYtSubTabChange('search');
      },
    },
    {
      id: 'library',
      label: 'Pustaka',
      icon: Library,
      isActive: isLibraryActive,
      onClick: () => {
        onViewChange('library');
        onFilterChange('all');
      },
    },
    {
      id: 'liked',
      label: 'Disukai',
      icon: Heart,
      isActive: isLikedActive,
      onClick: () => {
        onViewChange('ytmusic');
        onYtSubTabChange('liked');
      },
    },
    {
      id: 'downloads',
      label: 'Unduhan',
      icon: Download,
      isActive: isDownloadsActive,
      onClick: () => {
        onViewChange('library');
        onFilterChange('offline');
      },
    },
  ];

  return (
    <aside
      className="w-[88px] flex-shrink-0 flex flex-col items-center py-7 select-none z-20 bg-transparent"
      aria-label="Navigasi Utama"
    >
      {/* 3.1 Logo: 28x28 dua batang (atas #6B6B70, bawah --text #F4F4F0), margin bawah 24px */}
      <button
        onClick={() => {
          onViewChange('ytmusic');
          onYtSubTabChange('playlists');
        }}
        className="w-7 h-7 flex flex-col justify-between mb-6 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#F4F4F0] rounded-[4px] p-0.5"
        aria-label="AuraAudio Beranda"
        title="AuraAudio"
      >
        <div className="w-full h-2.5 rounded-[2px] bg-[#6B6B70]" />
        <div className="w-full h-2.5 rounded-[2px] bg-[#F4F4F0]" />
      </button>

      {/* Nav Items: Tombol 48x48, lingkaran (rounded-full), ikon 22px, garis 1.8px */}
      <nav className="flex flex-col items-center gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              aria-label={item.label}
              title={item.label}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                item.isActive
                  ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                  : 'bg-transparent text-[#8D8D93] hover:bg-[#1F1F23] hover:text-[#F4F4F0]'
              }`}
            >
              <Icon size={22} strokeWidth={1.8} />
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pengaturan di bagian bawah */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          aria-label="Pengaturan"
          title="Pengaturan"
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer bg-transparent text-[#8D8D93] hover:bg-[#1F1F23] hover:text-[#F4F4F0]"
        >
          <Settings size={22} strokeWidth={1.8} />
        </button>
      )}
    </aside>
  );
};
