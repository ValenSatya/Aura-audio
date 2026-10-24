import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Track } from '../../types/music';
import {
  SFListBullet,
  SFPersonCropCircle,
  SFDisc,
  SFMusicNote,
  SFArrowDownCircle,
  SFChevronRight,
  SFChevronLeft,
  SFUpload,
  SFCheckmark,
  SFXmark,
  SFPlayFill,
  SFShuffle,
  SFPlus,
  SFStar,
  SFStarFill,
  SFArrowUpArrowDown,
  SFLine3Horizontal,
  SFArrowDown,
  SFEllipsis,
  SFSearch,
} from '../common/AppleIcons';
import { MobileDownloadService } from '../../services/mobileDownloadService';
import { PlaylistTransferService } from '../../services/playlistTransferService';
import { MobilePlaylistStorage, CustomPlaylist } from '../../services/mobilePlaylistStorage';
import { MobilePlaylistDetailView } from './MobilePlaylistDetailView';
import { MobileAlbumDetailView } from './MobileAlbumDetailView';
import { MobileArtistDetailView } from './MobileArtistDetailView';
import { MobileSongInfoModal } from '../MobileSongInfoModal';
import { MobileSongActionMenu } from '../MobileSongActionMenu';
import { MobileAddToPlaylistModal } from '../MobileAddToPlaylistModal';

interface MobileLibraryViewProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onImportTracks: (tracks: Track[]) => void;
}

type LibrarySection = 'main' | 'playlists' | 'artists' | 'albums' | 'songs' | 'downloaded';

export const MobileLibraryView: React.FC<MobileLibraryViewProps> = ({
  tracks,
  onPlayTrack,
  onImportTracks,
}) => {
  const [activeSection, setActiveSection] = useState<LibrarySection>('main');
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>([]);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dedicated Detail Page States
  const [selectedPlaylist, setSelectedPlaylist] = useState<{
    id: string;
    name: string;
    description?: string;
    curator?: string;
    coverUrl?: string;
    tracks: Track[];
  } | null>(null);

  const [selectedAlbum, setSelectedAlbum] = useState<{
    title: string;
    artist: string;
    year?: string;
    genre?: string;
    coverUrl?: string;
    tracks: Track[];
  } | null>(null);

  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [songInfoTrack, setSongInfoTrack] = useState<Track | null>(null);
  const [actionMenuTrack, setActionMenuTrack] = useState<Track | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);

  // Songs Section Toolbar & Filters
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [showSongSearch, setShowSongSearch] = useState(false);
  const [songSortMode, setSongSortMode] = useState<'default' | 'title' | 'artist'>('default');
  const [songFilterDownloadedOnly, setSongFilterDownloadedOnly] = useState(false);

  // Favorite Star Tracking
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('aura_favorite_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleFavorite = (trackId: string) => {
    triggerHaptic(10);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      localStorage.setItem('aura_favorite_ids', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Custom playlists synced with MobilePlaylistStorage
  const [customPlaylists, setCustomPlaylists] = useState<CustomPlaylist[]>(() => {
    return MobilePlaylistStorage.getPlaylists();
  });

  useEffect(() => {
    const unsubPl = MobilePlaylistStorage.subscribe((updated) => setCustomPlaylists(updated));
    return unsubPl;
  }, []);

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const loadDownloads = async () => {
    const list = await MobileDownloadService.getDownloadedTracks();
    setDownloadedTracks(list);
    const bytes = await MobileDownloadService.getTotalDownloadedBytes();
    setTotalBytes(bytes);
  };

  useEffect(() => {
    loadDownloads();
    const unsub = MobileDownloadService.subscribe(loadDownloads);
    return unsub;
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await PlaylistTransferService.parsePlaylistFile(file);
      if (result.tracks.length > 0) {
        triggerHaptic(12);
        onImportTracks(result.tracks);
        alert(`Berhasil mengimpor ${result.tracks.length} lagu dari "${result.name}"!`);
      }
    } catch (err: any) {
      alert(`Gagal mengimpor file: ${err.message}`);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleExportJSON = () => {
    triggerHaptic(8);
    setShowExportModal(false);
    PlaylistTransferService.exportToJSON('Koleksi_AuraAudio', tracks);
  };

  const handleExportM3U = () => {
    triggerHaptic(8);
    setShowExportModal(false);
    PlaylistTransferService.exportToM3U('Koleksi_AuraAudio', tracks);
  };

  const handleCreatePlaylist = () => {
    const name = window.prompt('Masukkan nama playlist baru:');
    if (!name || !name.trim()) return;
    triggerHaptic(12);
    MobilePlaylistStorage.createPlaylist(name.trim());
  };

  const displayedSongs = useMemo(() => {
    let list = [...tracks];

    if (songFilterDownloadedOnly) {
      const downIds = new Set(downloadedTracks.map((d) => d.id));
      list = list.filter((t) => downIds.has(t.id));
    }

    if (songSearchQuery.trim()) {
      const q = songSearchQuery.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      );
    }

    if (songSortMode === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (songSortMode === 'artist') {
      list.sort((a, b) => a.artist.localeCompare(b.artist));
    }

    return list;
  }, [tracks, songFilterDownloadedOnly, downloadedTracks, songSearchQuery, songSortMode]);

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const librarySections = [
    { id: 'playlists' as const, label: 'Playlists', count: `${1 + customPlaylists.length} Playlists`, icon: SFListBullet },
    { id: 'artists' as const, label: 'Artists', count: `${new Set(tracks.map((t) => t.artist)).size} Artists`, icon: SFPersonCropCircle },
    { id: 'albums' as const, label: 'Albums', count: `${new Set(tracks.map((t) => t.album || t.title)).size} Albums`, icon: SFDisc },
    { id: 'songs' as const, label: 'Songs', count: `${tracks.length} Songs`, icon: SFMusicNote },
    {
      id: 'downloaded' as const,
      label: 'Downloaded',
      count: downloadedTracks.length > 0 ? `${downloadedTracks.length} Songs (${formatBytes(totalBytes)})` : 'Offline Storage',
      icon: SFArrowDownCircle,
    },
  ];

  // Distinct Artists
  const distinctArtists = Array.from(new Set(tracks.map((t) => t.artist))).map((artistName) => {
    const artistTracks = tracks.filter((t) => t.artist === artistName);
    return {
      name: artistName,
      trackCount: artistTracks.length,
      sampleTrack: artistTracks[0],
    };
  });

  // Distinct Albums
  const distinctAlbums = Array.from(new Set(tracks.map((t) => t.album || t.title))).map((albumTitle) => {
    const albumTracks = tracks.filter((t) => (t.album || t.title) === albumTitle);
    return {
      title: albumTitle,
      artist: albumTracks[0]?.artist || 'Various Artists',
      coverUrl: albumTracks[0]?.thumbnailUrl,
      trackCount: albumTracks.length,
      tracks: albumTracks,
    };
  });

  // 1. IF DEDICATED PLAYLIST DETAIL ACTIVE (Matching Figma mobile - playlist)
  if (selectedPlaylist) {
    return (
      <>
        <MobilePlaylistDetailView
          playlist={selectedPlaylist}
          onBack={() => setSelectedPlaylist(null)}
          onPlayTrack={onPlayTrack}
          onPlayAll={(tr, idx) => {
            const t = tr[idx || 0];
            if (t) onPlayTrack(t);
          }}
          onShuffle={(tr) => {
            const t = tr[Math.floor(Math.random() * tr.length)];
            if (t) onPlayTrack(t);
          }}
          onOpenSongInfo={(t) => setSongInfoTrack(t)}
        />
        <MobileSongInfoModal
          isOpen={!!songInfoTrack}
          onClose={() => setSongInfoTrack(null)}
          track={songInfoTrack}
        />
      </>
    );
  }

  // 2. IF DEDICATED ALBUM DETAIL ACTIVE (Matching Figma mobile - album)
  if (selectedAlbum) {
    return (
      <>
        <MobileAlbumDetailView
          album={selectedAlbum}
          onBack={() => setSelectedAlbum(null)}
          onPlayTrack={onPlayTrack}
          onPlayAll={(tr, idx) => {
            const t = tr[idx || 0];
            if (t) onPlayTrack(t);
          }}
          onShuffle={(tr) => {
            const t = tr[Math.floor(Math.random() * tr.length)];
            if (t) onPlayTrack(t);
          }}
          onSelectArtist={(artName) => {
            setSelectedAlbum(null);
            setSelectedArtist(artName);
          }}
          onOpenSongInfo={(t) => setSongInfoTrack(t)}
        />
        <MobileSongInfoModal
          isOpen={!!songInfoTrack}
          onClose={() => setSongInfoTrack(null)}
          track={songInfoTrack}
        />
      </>
    );
  }

  // 3. IF DEDICATED ARTIST DETAIL ACTIVE (Matching Figma mobile - artist)
  if (selectedArtist) {
    return (
      <MobileArtistDetailView
        artistName={selectedArtist}
        onBack={() => setSelectedArtist(null)}
        onPlayTrack={onPlayTrack}
        onSelectAlbum={(albId: string) => {
          setSelectedArtist(null);
          const found = distinctAlbums.find((a) => a.title.toLowerCase() === albId.toLowerCase());
          if (found) setSelectedAlbum(found);
        }}
      />
    );
  }

  // 4. SUB-VIEW: PLAYLISTS
  if (activeSection === 'playlists') {
    return (
      <div className="flex-1 overflow-y-auto px-5 select-none pb-40 space-y-5">
        <div className="flex items-center justify-between pt-4 pb-2 border-b border-white/[0.08]">
          <button
            onClick={() => {
              triggerHaptic(6);
              setActiveSection('main');
            }}
            className="flex items-center gap-1 text-white text-[15px] font-semibold active:opacity-70"
          >
            <SFChevronLeft size={20} fill="#FFFFFF" />
            <span>Library</span>
          </button>
          <button
            onClick={handleCreatePlaylist}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1 active:scale-95"
          >
            <SFPlus size={14} fill="#FFFFFF" />
            New Playlist
          </button>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Playlists</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Koleksi daftar putar terkurasi dan buatan sendiri</p>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {/* Default Curated Playlists */}
          <div
            onClick={() => {
              triggerHaptic(8);
              setSelectedPlaylist({
                id: 'pl_all',
                name: 'All Songs Collection',
                description: 'Koleksi lengkap seluruh master rekaman dalam pustaka AuraAudio.',
                curator: 'AuraAudio Master',
                coverUrl: '/assets/cover747_e84f19dd.png',
                tracks: tracks,
              });
            }}
            className="flex items-center gap-3.5 py-3 px-1 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
              <SFMusicNote size={24} fill="#FFFFFF" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white truncate">All Songs Collection</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{tracks.length} Songs • AuraAudio Master</p>
            </div>
            <SFChevronRight size={14} fill="#8E8E93" />
          </div>

          <div
            onClick={() => {
              triggerHaptic(8);
              const rockTracks = tracks.filter((t) => /linkin|metallica|system|rock|heavy/i.test(t.title + t.artist));
              setSelectedPlaylist({
                id: 'pl_rock',
                name: 'Rock & Heavy Hits',
                description: 'Anthems bertenaga tinggi dari band-band legendaris dunia.',
                curator: 'Apple Music Rock',
                coverUrl: '/assets/cover748_0643063b.png',
                tracks: rockTracks.length > 0 ? rockTracks : tracks.slice(0, 4),
              });
            }}
            className="flex items-center gap-3.5 py-3 px-1 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
              <SFDisc size={24} fill="#FFFFFF" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white truncate">Rock & Heavy Hits</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Linkin Park, Metallica, System of a Down</p>
            </div>
            <SFChevronRight size={14} fill="#8E8E93" />
          </div>

          <div
            onClick={() => {
              triggerHaptic(8);
              const popTracks = tracks.filter((t) => /britney|daft|weeknd|post|bad/i.test(t.artist));
              setSelectedPlaylist({
                id: 'pl_pop',
                name: 'Pop & Dance Essentials',
                description: 'Trek paling memikat dan menduduki puncak tangga lagu global.',
                curator: 'Apple Music Pop',
                coverUrl: '/assets/cover_britney_toxic.png',
                tracks: popTracks.length > 0 ? popTracks : tracks.slice(0, 4),
              });
            }}
            className="flex items-center gap-3.5 py-3 px-1 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
              <SFListBullet size={24} fill="#FFFFFF" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-white truncate">Pop & Dance Essentials</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Britney Spears, Daft Punk, Post Malone</p>
            </div>
            <SFChevronRight size={14} fill="#8E8E93" />
          </div>

          {/* User Custom Playlists */}
          {customPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => {
                triggerHaptic(8);
                setSelectedPlaylist({
                  id: pl.id,
                  name: pl.name,
                  description: pl.description || 'Daftar putar pribadi.',
                  curator: 'Koleksi Pribadi',
                  coverUrl: pl.coverUrl || '/assets/cover749_697d7b55.png',
                  tracks: pl.tracks.length > 0 ? pl.tracks : tracks.slice(0, 3),
                });
              }}
              className="flex items-center gap-3.5 py-3 px-1 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
                {pl.coverUrl ? (
                  <img src={pl.coverUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <SFMusicNote size={24} fill="#FFFFFF" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold text-white truncate">{pl.name}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{pl.tracks.length} Songs • Personal Playlist</p>
              </div>
              <SFChevronRight size={14} fill="#8E8E93" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. SUB-VIEW: ARTISTS (Clicking opens dedicated mobile - artist!)
  if (activeSection === 'artists') {
    return (
      <div className="flex-1 overflow-y-auto px-5 select-none pb-40 space-y-5">
        <div className="flex items-center justify-between pt-4 pb-2 border-b border-white/[0.08]">
          <button
            onClick={() => {
              triggerHaptic(6);
              setActiveSection('main');
            }}
            className="flex items-center gap-1 text-white text-[15px] font-semibold active:opacity-70"
          >
            <SFChevronLeft size={20} fill="#FFFFFF" />
            <span>Library</span>
          </button>
          <span className="text-xs font-medium text-neutral-400 tabular-nums">{distinctArtists.length} Artists</span>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Artists</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Ketuk artis untuk membuka profil & diskografi lengkap</p>
        </div>

        <div className="divide-y divide-white/[0.06] rounded-2xl liquid-glass overflow-hidden shadow-sm">
          {distinctArtists.map((artist) => (
            <div
              key={artist.name}
              onClick={() => {
                triggerHaptic(8);
                setSelectedArtist(artist.name);
              }}
              className="flex items-center justify-between p-3.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border border-white/10 flex-shrink-0 flex items-center justify-center shadow-sm">
                  {artist.sampleTrack?.thumbnailUrl ? (
                    <img src={artist.sampleTrack.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <SFPersonCropCircle size={22} fill="#FFFFFF" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-white truncate">{artist.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{artist.trackCount} Songs</p>
                </div>
              </div>
              <SFChevronRight size={14} fill="#8E8E93" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. SUB-VIEW: ALBUMS (Clicking opens dedicated mobile - album!)
  if (activeSection === 'albums') {
    return (
      <div className="flex-1 overflow-y-auto px-5 select-none pb-40 space-y-5">
        <div className="flex items-center justify-between pt-4 pb-2 border-b border-white/[0.08]">
          <button
            onClick={() => {
              triggerHaptic(6);
              setActiveSection('main');
            }}
            className="flex items-center gap-1 text-white text-[15px] font-semibold active:opacity-70"
          >
            <SFChevronLeft size={20} fill="#FFFFFF" />
            <span>Library</span>
          </button>
          <span className="text-xs font-medium text-neutral-400 tabular-nums">{distinctAlbums.length} Albums</span>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Albums</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Ketuk album untuk melihat nomor trek & kredit lengkap</p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {distinctAlbums.map((album) => (
            <div
              key={album.title}
              onClick={() => {
                triggerHaptic(8);
                setSelectedAlbum(album);
              }}
              className="liquid-glass p-2.5 rounded-2xl cursor-pointer active:scale-95 transition-all duration-150 flex flex-col gap-2 shadow-sm border border-white/5"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-neutral-900 relative shadow-md">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <SFDisc size={32} fill="#8E8E93" />
                  </div>
                )}
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[13.5px] font-semibold text-white truncate leading-tight">{album.title}</h4>
                <p className="text-[11.5px] text-neutral-400 truncate mt-0.5 leading-tight">{album.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. SUB-VIEW: SONGS (Exact 1:1 Matching Figma mobile - songs ID: 4474:33066)
  if (activeSection === 'songs') {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-5 select-none pb-40 space-y-3 font-sans">
          {/* Top Bar Matching Figma: Circular Back Button, Title, and Right Action Pill */}
          <div className="flex items-center justify-between pt-3 pb-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  triggerHaptic(6);
                  setActiveSection('main');
                }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white active:scale-90 transition-transform"
                aria-label="Back to Library"
              >
                <SFChevronLeft size={20} fill="#FFFFFF" />
              </button>
              <h1 className="text-[20px] font-bold text-white tracking-tight">Songs</h1>
            </div>

            {/* Right Action Capsule Pill: Sort, Filter, Search */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/5 backdrop-blur-md">
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setSongSortMode((prev) => (prev === 'default' ? 'title' : prev === 'title' ? 'artist' : 'default'));
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  songSortMode !== 'default' ? 'text-white bg-white/20' : 'text-white/70 hover:text-white'
                }`}
                title={`Urutkan: ${songSortMode === 'default' ? 'Default' : songSortMode === 'title' ? 'Judul (A-Z)' : 'Artis (A-Z)'}`}
              >
                <SFArrowUpArrowDown size={17} fill="currentColor" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setSongFilterDownloadedOnly((prev) => !prev);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  songFilterDownloadedOnly ? 'text-white bg-white/20' : 'text-white/70 hover:text-white'
                }`}
                title={songFilterDownloadedOnly ? 'Tampilkan Semua' : 'Filter: Hanya Terunduh'}
              >
                <SFLine3Horizontal size={17} fill="currentColor" />
              </button>
              <button
                onClick={() => {
                  triggerHaptic(8);
                  setShowSongSearch((prev) => !prev);
                  if (showSongSearch) setSongSearchQuery('');
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  showSongSearch ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
                title="Cari Lagu"
              >
                <SFSearch size={16} fill="currentColor" />
              </button>
            </div>
          </div>

          {/* Quick Search Input (Revealed on Search Icon Tap) */}
          {showSongSearch && (
            <div className="pt-1 animate-in fade-in duration-150">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder="Cari lagu atau artis..."
                  autoFocus
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30"
                />
                <div className="absolute left-3 text-neutral-400">
                  <SFSearch size={15} fill="currentColor" />
                </div>
                {songSearchQuery && (
                  <button
                    onClick={() => setSongSearchQuery('')}
                    className="absolute right-3 text-neutral-400 hover:text-white"
                  >
                    <SFXmark size={14} fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Sort / Filter Chips Notice */}
          {(songSortMode !== 'default' || songFilterDownloadedOnly) && (
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 px-1">
              {songSortMode !== 'default' && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-medium">
                  Urutan: {songSortMode === 'title' ? 'Judul' : 'Artis'}
                </span>
              )}
              {songFilterDownloadedOnly && (
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-medium">
                  Hanya Terunduh
                </span>
              )}
              <button
                onClick={() => {
                  setSongSortMode('default');
                  setSongFilterDownloadedOnly(false);
                }}
                className="text-white/60 hover:text-white underline ml-auto text-[11px]"
              >
                Reset
              </button>
            </div>
          )}

          {/* Flat Minimalist Songs List - Matching Figma (NO Card wrappers!) */}
          <div className="divide-y divide-white/[0.04] pt-1">
            {displayedSongs.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                Tidak ada lagu yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              displayedSongs.map((track) => {
                const isDownloaded = downloadedTracks.some((d) => d.id === track.id);
                const isFav = favoriteIds.has(track.id);

                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      triggerHaptic(8);
                      onPlayTrack(track);
                    }}
                    className="flex items-center justify-between py-2.5 px-0.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer group"
                  >
                    {/* Left: Artwork + Title & Artist */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-neutral-900 border border-white/5 flex-shrink-0 flex items-center justify-center shadow-sm">
                        {track.thumbnailUrl ? (
                          <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <SFMusicNote size={18} fill="rgba(255,255,255,0.4)" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-[14.5px] font-medium text-white truncate tracking-tight">
                          {track.title}
                        </h4>
                        <p className="text-[12.5px] text-neutral-400 truncate mt-0.5 font-normal">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Right Side Actions: Download, Star (Favorite), Ellipsis More */}
                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* 1. Download Arrow */}
                      <button
                        onClick={async () => {
                          triggerHaptic(10);
                          if (isDownloaded) {
                            await MobileDownloadService.removeDownload(track.id);
                          } else {
                            await MobileDownloadService.downloadTrack(track);
                          }
                          await loadDownloads();
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isDownloaded ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                        title={isDownloaded ? 'Tersimpan Offline' : 'Unduh Offline'}
                      >
                        {isDownloaded ? (
                          <SFCheckmark size={15} fill="#FFFFFF" />
                        ) : (
                          <SFArrowDown size={17} fill="currentColor" />
                        )}
                      </button>

                      {/* 2. Favorite Star */}
                      <button
                        onClick={() => toggleFavorite(track.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-transform"
                        title={isFav ? 'Hapus dari Favorit' : 'Favoritkan'}
                      >
                        {isFav ? (
                          <SFStarFill size={18} fill="#FFFFFF" />
                        ) : (
                          <SFStar size={18} fill="currentColor" />
                        )}
                      </button>

                      {/* 3. More Actions Ellipsis */}
                      <button
                        onClick={() => {
                          triggerHaptic(6);
                          setActionMenuTrack(track);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-transform"
                        title="Opsi Lainnya"
                      >
                        <SFEllipsis size={18} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Menu Sheet */}
        <MobileSongActionMenu
          isOpen={!!actionMenuTrack}
          onClose={() => setActionMenuTrack(null)}
          track={actionMenuTrack}
          isFavorite={actionMenuTrack ? favoriteIds.has(actionMenuTrack.id) : false}
          onToggleFavorite={(t) => toggleFavorite(t.id)}
          onAddToPlaylist={(t) => setAddToPlaylistTrack(t)}
          onPlayNext={(t) => {
            onPlayTrack(t);
          }}
          onDownload={async (t) => {
            await MobileDownloadService.downloadTrack(t);
            await loadDownloads();
          }}
          onOpenSongInfo={(t) => setSongInfoTrack(t)}
        />

        {/* Add to Playlist Modal */}
        <MobileAddToPlaylistModal
          isOpen={!!addToPlaylistTrack}
          onClose={() => setAddToPlaylistTrack(null)}
          track={addToPlaylistTrack}
        />

        {/* Song Info & Credits Modal */}
        <MobileSongInfoModal
          isOpen={!!songInfoTrack}
          onClose={() => setSongInfoTrack(null)}
          track={songInfoTrack}
        />
      </>
    );
  }

  // 8. SUB-VIEW: DOWNLOADED
  if (activeSection === 'downloaded') {
    return (
      <div className="flex-1 overflow-y-auto px-5 select-none pb-40 space-y-5">
        <div className="flex items-center justify-between pt-4 pb-2 border-b border-white/[0.08]">
          <button
            onClick={() => {
              triggerHaptic(6);
              setActiveSection('main');
            }}
            className="flex items-center gap-1 text-white text-[15px] font-semibold active:opacity-70"
          >
            <SFChevronLeft size={20} fill="#FFFFFF" />
            <span>Library</span>
          </button>
          <span className="text-xs font-medium text-neutral-400 tabular-nums">{formatBytes(totalBytes)}</span>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Downloaded</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {downloadedTracks.length} tracks stored locally on device • Instant 0ms offline playback
          </p>
        </div>

        {downloadedTracks.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <SFArrowDownCircle size={44} fill="rgba(255,255,255,0.2)" className="mx-auto" />
            <h3 className="text-[16px] font-bold text-white">No Downloaded Songs</h3>
            <p className="text-xs text-neutral-400 max-w-[240px] mx-auto">
              Tap the download icon on any song or in Now Playing to save tracks offline.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {downloadedTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => {
                  triggerHaptic(8);
                  onPlayTrack(track);
                }}
                className="flex items-center justify-between py-2.5 px-0.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-neutral-900 border border-white/5 flex-shrink-0 flex items-center justify-center shadow-sm">
                    {track.thumbnailUrl ? (
                      <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <SFMusicNote size={18} fill="rgba(255,255,255,0.4)" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="text-[14.5px] font-medium text-white truncate tracking-tight">{track.title}</h4>
                    <p className="text-[12.5px] text-neutral-400 truncate mt-0.5 font-normal">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      triggerHaptic(6);
                      setActionMenuTrack(track);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white"
                    title="Opsi"
                  >
                    <SFEllipsis size={18} fill="currentColor" />
                  </button>

                  <button
                    onClick={async () => {
                      triggerHaptic(10);
                      await MobileDownloadService.removeDownload(track.id);
                      await loadDownloads();
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 active:scale-90 transition-transform"
                    title="Hapus Unduhan"
                  >
                    <SFXmark size={15} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 9. ROOT VIEW: PERPUSTAKAAN UTAMA
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 select-none pb-40 space-y-6 font-sans">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.m3u,.m3u8,.csv"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Header Matching Figma Frame 336 / Frame 360 & Action Button */}
        <div className="flex items-center justify-between pt-4 pb-2 border-b border-white/[0.06]">
          <h1 className="text-[20px] font-bold text-white tracking-tight">Library</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic(6);
                setShowExportModal(true);
              }}
              className="liquid-glass-pill px-3 py-1.5 rounded-full text-xs font-semibold text-white/90 active:scale-95 transition-all shadow-sm"
            >
              Export / Import
            </button>
          </div>
        </div>

        {/* iOS Category Inset List (Monochrome Clean Icons) */}
        <div className="rounded-[18px] liquid-glass divide-y divide-white/[0.08] overflow-hidden shadow-lg border border-white/5">
          {librarySections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  triggerHaptic(6);
                  setActiveSection(sec.id);
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors text-left"
              >
                <div className="flex items-center gap-3.5">
                  <Icon size={20} fill="#FFFFFF" />
                  <span className="text-[15px] font-semibold text-white">{sec.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">{sec.count}</span>
                  <SFChevronRight size={14} fill="#8E8E93" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Recently Added Section (Only when user has tracks) / Clean Empty State for New User */}
        {tracks.length > 0 ? (
          <div className="space-y-3 pt-2">
            <h2 className="text-[18px] font-bold text-white tracking-tight">Recently Added</h2>

            <div className="grid grid-cols-2 gap-3.5">
              {tracks.slice(0, 8).map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => {
                    triggerHaptic(8);
                    const matchingAlbum = distinctAlbums.find(
                      (a) => a.title.toLowerCase() === (track.album || track.title).toLowerCase()
                    );
                    if (matchingAlbum) {
                      setSelectedAlbum(matchingAlbum);
                    } else {
                      onPlayTrack(track);
                    }
                  }}
                  className="liquid-glass p-2.5 rounded-[16px] cursor-pointer active:scale-95 transition-all duration-150 flex flex-col gap-2 shadow-sm border border-white/5"
                >
                  <div className="w-full aspect-square rounded-[10px] overflow-hidden bg-neutral-900 relative shadow-sm border border-white/5">
                    {track.thumbnailUrl ? (
                      <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SFMusicNote size={24} fill="#8E8E93" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[13.5px] font-semibold text-white truncate leading-tight">{track.title}</h4>
                    <p className="text-[11.5px] text-neutral-400 truncate mt-0.5 leading-tight">{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-8 pb-10 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-400 mb-3 shadow-inner">
              <SFMusicNote size={26} fill="#A1A1AA" />
            </div>
            <h3 className="text-[16px] font-bold text-white tracking-tight">Perpustakaan Masih Kosong</h3>
            <p className="text-[13px] text-neutral-400 max-w-[260px] mt-1 leading-relaxed">
              Lagu atau album yang kamu favoritkan atau download akan muncul di sini.
            </p>
          </div>
        )}

        {/* Playlist Export / Import Modal Sheet */}
        {showExportModal && (
          <div
            className="fixed inset-0 z-50 bg-black/75 flex items-end justify-center animate-in fade-in duration-150"
            onClick={() => setShowExportModal(false)}
          >
            <div
              className="w-full max-w-md liquid-glass rounded-t-[28px] p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: 'calc(var(--sab) + 20px)' }}
            >
              <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white text-center">Playlist Transfer</h3>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                    setShowExportModal(false);
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.08] border border-white/10 text-white font-medium active:scale-98 transition-all"
                >
                  <SFUpload size={20} fill="#FFFFFF" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Import Playlist</p>
                    <p className="text-xs text-neutral-400">Supports .json, .m3u, .csv</p>
                  </div>
                </button>

                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.08] border border-white/10 text-white font-medium active:scale-98 transition-all"
                >
                  <SFDisc size={20} fill="#FFFFFF" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Export as JSON</p>
                    <p className="text-xs text-neutral-400">Full metadata backup</p>
                  </div>
                </button>

                <button
                  onClick={handleExportM3U}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.08] border border-white/10 text-white font-medium active:scale-98 transition-all"
                >
                  <SFMusicNote size={20} fill="#FFFFFF" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Export as M3U</p>
                    <p className="text-xs text-neutral-400">Standard music player playlist</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <MobileSongActionMenu
        isOpen={!!actionMenuTrack}
        onClose={() => setActionMenuTrack(null)}
        track={actionMenuTrack}
        isFavorite={actionMenuTrack ? favoriteIds.has(actionMenuTrack.id) : false}
        onToggleFavorite={(t) => toggleFavorite(t.id)}
        onAddToPlaylist={(t) => setAddToPlaylistTrack(t)}
        onPlayNext={(t) => onPlayTrack(t)}
        onDownload={async (t) => {
          await MobileDownloadService.downloadTrack(t);
          await loadDownloads();
        }}
        onOpenSongInfo={(t) => setSongInfoTrack(t)}
      />

      <MobileAddToPlaylistModal
        isOpen={!!addToPlaylistTrack}
        onClose={() => setAddToPlaylistTrack(null)}
        track={addToPlaylistTrack}
      />

      <MobileSongInfoModal
        isOpen={!!songInfoTrack}
        onClose={() => setSongInfoTrack(null)}
        track={songInfoTrack}
      />
    </>
  );
};
