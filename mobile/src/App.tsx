import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Track, MobileTab } from './types/music';
import { useMobilePlaylist } from './hooks/useMobilePlaylist';
import { useMobileAudioEngine } from './hooks/useMobileAudioEngine';
import { MobileYoutubeService } from './services/mobileYoutubeService';
import { MobileDownloadService } from './services/mobileDownloadService';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMiniPlayer } from './components/MobileMiniPlayer';
import { MobileNowPlayingModal } from './components/MobileNowPlayingModal';
import { MobileEqualizerModal } from './components/MobileEqualizerModal';
import { MobileAuthModal } from './components/MobileAuthModal';
import { MobileHomeView } from './components/views/MobileHomeView';
import { MobileLibraryView } from './components/views/MobileLibraryView';
import { MobileSearchView } from './components/views/MobileSearchView';
import { MobileProfileView } from './components/views/MobileProfileView';
import { MobileAlbumDetailView } from './components/views/MobileAlbumDetailView';
import { MobileArtistDetailView } from './components/views/MobileArtistDetailView';
import { MobileAuthView } from './components/views/MobileAuthView';
import { AuraSyncService } from './services/auraSyncService';
import { ApiClient, UserProfile } from './services/apiClient';

function getTrackVideoId(track?: Track | null): string | null {
  if (!track) return null;
  if (track.id && /^[a-zA-Z0-9_-]{11}$/.test(track.id)) return track.id;
  if (track.url) {
    const match = track.url.match(/(?:v=|\/shorts\/|\/embed\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
}

export function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [authUser, setAuthUser] = useState<UserProfile | null>(() => ApiClient.getUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: string;
    title: string;
    artist: string;
    year?: string;
    coverUrl?: string;
    tracks: Track[];
  } | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<{ id?: string; name: string } | null>(null);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);
  const [syncData, setSyncData] = useState<{ isConnected: boolean; user: any | null }>({
    isConnected: false,
    user: null,
  });

  const handleSelectArtist = useCallback((artistId?: string, artistName?: string) => {
    if (!artistName && !artistId) return;
    setSelectedArtist({ id: artistId, name: artistName || 'Artist' });
  }, []);

  const handleSelectAlbum = useCallback(async (albumId: string, albumTitle?: string) => {
    setIsLoadingAlbum(true);
    try {
      const detail = await ApiClient.getAlbumDetail(albumId);
      if (detail && detail.tracks && detail.tracks.length > 0) {
        setSelectedAlbum({
          id: detail.id,
          title: detail.title,
          artist: detail.artist,
          year: detail.year,
          coverUrl: detail.coverUrl,
          tracks: detail.tracks,
        });
      } else {
        const searchTracks = await ApiClient.searchMusic(albumTitle || albumId);
        setSelectedAlbum({
          id: albumId,
          title: albumTitle || 'Album',
          artist: searchTracks[0]?.artist || 'Artist',
          coverUrl: searchTracks[0]?.thumbnailUrl,
          tracks: searchTracks,
        });
      }
    } catch (err) {
      console.warn('Failed to load album:', err);
    } finally {
      setIsLoadingAlbum(false);
    }
  }, []);

  const handleOpenAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    ApiClient.logout();
    setAuthUser(null);
  }, []);

  const handleAuthSuccess = useCallback((user: UserProfile) => {
    setAuthUser(user);
    setIsAuthOpen(false);
    setIsAuthModalOpen(false);
    ApiClient.syncAll().catch(() => {});
  }, []);

  const playRequestIdRef = useRef(0);

  const {
    tracks,
    queue,
    currentTrack,
    currentTrackIndex,
    setCurrentTrackIndex,
    isShuffle,
    repeatMode,
    playInQueue,
    playTrackAtomic,
    addToQueue,
    importTracksToLibrary,
    getNextIndex,
    getPrevIndex,
    toggleShuffle,
    toggleRepeat,
  } = useMobilePlaylist();

  // Connect to AuraSync server on local Wi-Fi
  useEffect(() => {
    AuraSyncService.connect();
    const unsub = AuraSyncService.subscribe((data) => {
      setSyncData({ isConnected: data.isConnected, user: data.user });
    });
    return () => {
      unsub();
    };
  }, []);

  const consecutiveErrorsRef = useRef(0);
  const skipTimerRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const playTrackAtIndexRef = useRef<(index: number) => Promise<void>>(async () => {});
  const handleNextRef = useRef<() => void>(() => {});

  const handleNext = useCallback(() => {
    const nextIdx = getNextIndex();
    if (nextIdx !== null && nextIdx >= 0 && nextIdx < queue.length) {
      playTrackAtIndexRef.current(nextIdx);
    }
  }, [getNextIndex, queue]);
  handleNextRef.current = handleNext;

  const handlePrev = useCallback(() => {
    const prevIdx = getPrevIndex();
    if (prevIdx !== null && prevIdx >= 0 && prevIdx < queue.length) {
      playTrackAtIndexRef.current(prevIdx);
    }
  }, [getPrevIndex, queue]);

  const handlePlaybackFailure = useCallback((errorMsg?: string) => {
    console.warn('[Mobile] Audio playback issue detected:', errorMsg);
    // Never auto-skip erratically! Cancel any previous skip timers
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
  }, []);

  const {
    audioRefA,
    audioRefB,
    activeDeck,
    isPlaying,
    currentTime,
    duration,
    bands,
    currentPreset,
    crossfadeSettings,
    play,
    pause,
    togglePlay,
    seek,
    prepareTrackChange,
    loadSource,
    preloadStandbySource,
    setBandGain,
    applyPreset,
    resetEQ,
    setCrossfadeSettings,
  } = useMobileAudioEngine({
    currentTrack,
    onTrackEnded: () => handleNextRef.current(),
    onPlaybackError: (err) => handlePlaybackFailure(err),
    onNext: () => handleNextRef.current(),
    onPrev: () => handlePrev(),
  });

  const playTrackAtIndex = useCallback(
    async (index: number) => {
      if (index < 0 || index >= queue.length) return;
      const target = queue[index];

      // 1. Instantly silence old song and reset duration/timeline (0ms)
      prepareTrackChange(target);
      setCurrentTrackIndex(index);
      const reqId = ++playRequestIdRef.current;

      try {
        let streamUrl = target.url;

        // Check if track is downloaded locally for 0ms offline playback!
        const localUrl = await MobileDownloadService.getDownloadedAudioUrl(target.id);
        const targetVideoId = getTrackVideoId(target);

        if (localUrl) {
          streamUrl = localUrl;
        } else if (targetVideoId) {
          // Direct Dedicated Backend Streaming Proxy (Instant HTTP 206 stream via Innertube ~200ms)
          streamUrl = ApiClient.getAudioStreamProxyUrl(targetVideoId);
        } else if (target.sourceType === 'youtube' || /youtube\.com|youtu\.be/.test(target.url)) {
          streamUrl = await MobileYoutubeService.resolveStreamUrl(target.url);
        }

        if (reqId !== playRequestIdRef.current) return;
        loadSource(streamUrl);
        await play();
        consecutiveErrorsRef.current = 0;

        // 2. Pre-warm upcoming tracks & preload next track on standby deck for true 0ms gapless switching!
        if (queue.length > 1) {
          const nextIdx = (index + 1) % queue.length;
          const nextNextIdx = (index + 2) % queue.length;
          const nextTrack = queue[nextIdx];
          const nextNextTrack = queue[nextNextIdx];

          const upcomingIds: string[] = [];
          const nextVid = getTrackVideoId(nextTrack);
          const nextNextVid = getTrackVideoId(nextNextTrack);
          if (nextVid) upcomingIds.push(nextVid);
          if (nextNextVid) upcomingIds.push(nextNextVid);

          if (upcomingIds.length > 0) {
            ApiClient.prewarmStreams(upcomingIds);
          }

          if (nextVid) {
            const nextProxyUrl = ApiClient.getAudioStreamProxyUrl(nextVid);
            preloadStandbySource(nextProxyUrl);
          }
        }
      } catch (e: any) {
        console.warn('Mobile play error:', e);
        handlePlaybackFailure(e?.message || 'Gagal memutar audio');
      }
    },
    [queue, prepareTrackChange, loadSource, preloadStandbySource, play, setCurrentTrackIndex, handlePlaybackFailure]
  );
  playTrackAtIndexRef.current = playTrackAtIndex;

  const handlePlaySingle = useCallback(
    async (track: Track) => {
      // 1. Instantly silence old song and reset duration/timeline (0ms)
      prepareTrackChange(track);
      playTrackAtomic(track);
      const reqId = ++playRequestIdRef.current;

      try {
        let streamUrl = track.url;

        // Check if track is downloaded locally for 0ms offline playback!
        const localUrl = await MobileDownloadService.getDownloadedAudioUrl(track.id);
        const videoId = getTrackVideoId(track);

        if (localUrl) {
          streamUrl = localUrl;
        } else if (videoId) {
          // Direct Dedicated Backend Streaming Proxy (Instant HTTP 206 stream via Innertube ~200ms)
          streamUrl = ApiClient.getAudioStreamProxyUrl(videoId);
        } else if (track.sourceType === 'youtube' || /youtube\.com|youtu\.be/.test(track.url)) {
          streamUrl = await MobileYoutubeService.resolveStreamUrl(track.url);
        }

        if (reqId !== playRequestIdRef.current) return;
        loadSource(streamUrl);
        await play();
        consecutiveErrorsRef.current = 0;
      } catch (e: any) {
        console.warn('Play error:', e);
        handlePlaybackFailure(e?.message || 'Gagal memutar audio');
      }
    },
    [prepareTrackChange, playTrackAtomic, loadSource, play, handlePlaybackFailure]
  );

  const handlePlayPlaylist = useCallback(
    (playlistTracks: Track[], startIndex: number = 0) => {
      playInQueue(playlistTracks, startIndex);
      playTrackAtIndexRef.current(startIndex);
    },
    [playInQueue]
  );

  const handleTogglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
      return;
    }
    const activeEl = activeDeck === 'A' ? audioRefA.current : audioRefB.current;
    if ((!activeEl || !activeEl.src || activeEl.src === window.location.href || activeEl.src === '') && currentTrack) {
      await handlePlaySingle(currentTrack);
      return;
    }
    await play();
  }, [isPlaying, pause, play, currentTrack, handlePlaySingle, activeDeck, audioRefA, audioRefB]);

  return (
    <div
      className="h-full w-full max-w-[430px] mx-auto bg-black text-white flex flex-col justify-between overflow-hidden relative select-none shadow-[0_0_80px_rgba(0,0,0,0.95)] sm:border-x sm:border-white/10"
      style={{
        paddingTop: 'var(--sat)',
      }}
    >
      {/* Hidden Dual-Deck Audio Elements */}
      <audio ref={audioRefA} preload="auto" crossOrigin="anonymous" />
      <audio ref={audioRefB} preload="auto" crossOrigin="anonymous" />

      {/* Main Tab Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {isAuthOpen ? (
          <MobileAuthView
            initialMode={authModalMode}
            onBack={() => setIsAuthOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        ) : selectedArtist ? (
          <MobileArtistDetailView
            artistId={selectedArtist.id}
            artistName={selectedArtist.name}
            onBack={() => setSelectedArtist(null)}
            onPlayTrack={handlePlaySingle}
            onPlayPlaylist={handlePlayPlaylist}
            onSelectAlbum={handleSelectAlbum}
            onSelectArtist={(id, name) => handleSelectArtist(id, name)}
          />
        ) : selectedAlbum ? (
          <MobileAlbumDetailView
            album={selectedAlbum}
            onBack={() => setSelectedAlbum(null)}
            onPlayTrack={handlePlaySingle}
            onPlayAll={(albumTracks, startIndex) => handlePlayPlaylist(albumTracks, startIndex ?? 0)}
            onShuffle={(albumTracks) => {
              const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
              handlePlayPlaylist(shuffled, 0);
            }}
            onSelectArtist={(name) => handleSelectArtist(undefined, name)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <MobileHomeView
                tracks={tracks}
                onPlayTrack={handlePlaySingle}
                onPlayPlaylist={handlePlayPlaylist}
                onOpenProfile={() => setActiveTab('profile')}
                onOpenAuth={handleOpenAuth}
                onSelectAlbum={handleSelectAlbum}
                onSelectArtist={handleSelectArtist}
                user={authUser}
              />
            )}

            {activeTab === 'search' && (
              <MobileSearchView
                onPlayTrack={handlePlaySingle}
                onAddToQueue={addToQueue}
                onSelectAlbum={handleSelectAlbum}
                onSelectArtist={handleSelectArtist}
              />
            )}

            {activeTab === 'library' && (
              <MobileLibraryView
                tracks={tracks}
                onPlayTrack={handlePlaySingle}
                onImportTracks={(newTracks) => {
                  importTracksToLibrary(newTracks);
                  handlePlayPlaylist(newTracks, 0);
                }}
              />
            )}

            {activeTab === 'profile' && (
              <div className="flex-1 overflow-y-auto">
                <MobileProfileView
                  currentPreset={currentPreset}
                  crossfadeSettings={crossfadeSettings}
                  onOpenEQ={() => setIsEQOpen(true)}
                  onSetCrossfadeSettings={setCrossfadeSettings}
                  onNavigateToLibraryDownloads={() => setActiveTab('library')}
                  syncData={syncData}
                  user={authUser}
                  onOpenAuth={handleOpenAuth}
                  onLogout={handleLogout}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Apple Music Floating Mini Player */}
      <MobileMiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onOpenNowPlaying={() => setIsNowPlayingOpen(true)}
      />

      {/* Apple Music 4-Tab Floating Dock */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedAlbum(null);
          setActiveTab(tab);
        }}
      />

      {/* Fullscreen Apple Music Now Playing Modal (Clean 1:1, No Lyrics) */}
      <MobileNowPlayingModal
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        queue={queue}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={seek}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onOpenEQ={() => setIsEQOpen(true)}
        onPlayTrack={handlePlaySingle}
      />

      {/* 8-Band Equalizer Modal */}
      <MobileEqualizerModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        bands={bands}
        currentPreset={currentPreset}
        onBandChange={setBandGain}
        onPresetSelect={applyPreset}
        onReset={resetEQ}
      />

      {/* Apple Auth Modal (Login / Register) */}
      <MobileAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default App;
