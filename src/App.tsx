import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, X, Download, CheckCircle2 } from 'lucide-react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { usePlaylist } from './hooks/usePlaylist';
import { useDownloads } from './hooks/useDownloads';
import { useSleepTimer } from './hooks/useSleepTimer';
import { PlayerBar } from './components/PlayerBar';
import { Sidebar } from './components/Sidebar';
import { TrackList } from './components/TrackList';
import { Equalizer } from './components/Equalizer';
import { QueueDrawer } from './components/QueueDrawer';
import { ImportModal } from './components/ImportModal';
import { AuthModal } from './components/AuthModal';
import { YTMusicView } from './components/YTMusicView';
import { UserProfile, Track, CustomPlaylist, AppSettings, CrossfadeSettings } from './types/music';
import { useCustomPlaylists } from './hooks/useCustomPlaylists';
import { PlaylistModal } from './components/PlaylistModal';
import { PlaylistOverviewPanel } from './components/PlaylistOverviewPanel';
import { LiveStageView } from './components/LiveStageView';
import { TopBar } from './components/TopBar';
import { SettingsModal } from './components/SettingsModal';
import { LibraryGridView } from './components/LibraryGridView';
import { TitleBar } from './components/TitleBar';
import { useCoverColors } from './hooks/useCoverColors';
import { useTrackCover } from './utils/coverArt';

export function App() {
  const [streamServerUrl, setStreamServerUrl] = useState('http://127.0.0.1:45454');
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistModalMode, setPlaylistModalMode] = useState<'create' | 'add_to'>('create');
  const [playlistModalTargetTrackIds, setPlaylistModalTargetTrackIds] = useState<string[]>([]);
  const [importInitialTab, setImportInitialTab] = useState<'youtube' | 'playlist' | 'local' | 'spotify'>('youtube');
  const [activeMainView, setActiveMainView] = useState<'ytmusic' | 'library' | 'custom_playlist' | 'stage'>('ytmusic');
  const [selectedLibraryPlaylist, setSelectedLibraryPlaylist] = useState<string | null>(null);
  const [activeCustomPlaylistId, setActiveCustomPlaylistId] = useState<string | null>(null);
  const [ytSubTab, setYtSubTab] = useState<'search' | 'liked' | 'playlists'>('search');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>({ isLoggedIn: false });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem('aura_app_settings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      dynamicLighting: {
        enabled: true,
        intensity: 'medium',
      },
      audio: {
        preferStudioAudio: true,
        crossfadeDuration: 4,
        crossfadeEnabled: true,
      },
      storage: {
        autoBackupPlaylists: true,
      },
    };
  });
  const [isOverviewOpen, setIsOverviewOpen] = useState(() => {
    try {
      return localStorage.getItem('aura_is_overview_open') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aura_is_overview_open', String(isOverviewOpen));
    } catch {}
  }, [isOverviewOpen]);

  // Fetch local stream server URL and local account / YouTube Music Auth status
  useEffect(() => {
    async function initElectronData() {
      if (window.electronAPI?.getStreamServerUrl) {
        try {
          const url = await window.electronAPI.getStreamServerUrl();
          setStreamServerUrl(url);
        } catch (e) {
          console.error('Failed to get stream server url:', e);
        }
      }

      // Check persistent local account first
      if (window.electronAPI?.getCurrentAccount) {
        try {
          const localUser = await window.electronAPI.getCurrentAccount();
          if (localUser && localUser.isLoggedIn) {
            setUserProfile(localUser);
            return;
          }
        } catch (e) {
          console.error('Failed to get current local account:', e);
        }
      }

      if (window.electronAPI?.getYouTubeMusicAuthStatus) {
        try {
          const status = await window.electronAPI.getYouTubeMusicAuthStatus();
          if (status?.isLoggedIn) {
            setUserProfile(status);
          }
        } catch (e) {
          console.error('Failed to get auth status:', e);
        }
      }
    }
    initElectronData();
  }, []);

  // Track ended and playback progress callback refs to avoid circular dependency
  const handleTrackEndedRef = useRef<() => void>(() => {});
  const handlePlaybackProgressRef = useRef<(curTime: number, dur: number) => void>(() => {});
  // Playback request ID ref to cancel stale requests when user clicks rapidly
  const playRequestIdRef = useRef<number>(0);
  // Auto crossfade tracking refs
  const hasCrossfadedThisTrackRef = useRef<boolean>(false);
  const isPrefetchingNextRef = useRef<boolean>(false);

  const {
    audioRefA,
    audioRefB,
    activeDeck,
    crossfadeSettings,
    updateCrossfadeSettings,
    crossfadeTo,
    analyserRef,
    isPlaying,
    isBuffering,
    setIsBuffering,
    playbackError,
    clearPlaybackError,
    currentTime,
    duration,
    bufferedTime,
    volume,
    isMuted,
    bands,
    currentPreset,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setBandGain,
    applyPreset,
    resetEQ,
    loadSource,
    preloadStandbySource,
  } = useAudioEngine({
    onTrackEnded: () => {
      handleTrackEndedRef.current();
    },
    onPlaybackProgress: (curTime, dur) => {
      handlePlaybackProgressRef.current(curTime, dur);
    },
  });

  const {
    tracks,
    filteredTracks,
    queue,
    currentTrack,
    currentTrackIndex,
    filter,
    searchQuery,
    isShuffle,
    repeatMode,
    setFilter,
    setSearchQuery,
    addTracks,
    removeTrack,
    clearPlaylist,
    updateTrack,
    addOrUpdateDownloadedTrack,
    setTracks,
    selectTrack,
    playTrackAtomic,
    playPlaylistAtomic,
    playPlaylistShuffled,
    setCurrentTrackIndex,
    getNextIndex,
    getPrevIndex,
    toggleShuffle,
    toggleRepeat,
    getPlayableUrl,
    resolvePlayableUrl,
    prefetchTrackStream,
    addToQueue,
    playNextInQueue,
    removeFromQueue,
    clearQueue,
  } = usePlaylist(streamServerUrl);

  const { batchProgress, startDownload, startBatchDownload, cancelBatchDownload, removeDownload } = useDownloads(
    (trackData) => {
      addOrUpdateDownloadedTrack(trackData);
    }
  );

  const {
    customPlaylists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    setPlaylistTracks,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    removeTracksFromPlaylist,
  } = useCustomPlaylists();

  // Active custom playlist and resolved tracks
  const activeCustomPlaylist = React.useMemo(() => {
    if (!activeCustomPlaylistId) return null;
    return customPlaylists.find((p: CustomPlaylist) => p.id === activeCustomPlaylistId) || null;
  }, [customPlaylists, activeCustomPlaylistId]);

  const customPlaylistTracks = React.useMemo(() => {
    if (!activeCustomPlaylist) return [];

    let list: Track[] = [];

    // 1. Direct persistent tracks stored on the playlist itself
    if (activeCustomPlaylist.tracks && activeCustomPlaylist.tracks.length > 0) {
      list = activeCustomPlaylist.tracks;
    } else {
      // 2. Fallback: match by ID, URL, or YouTube video ID against library tracks
      const trackMapById = new Map<string, Track>();
      const trackMapByUrl = new Map<string, Track>();
      const trackMapByYtId = new Map<string, Track>();

      for (const t of tracks) {
        trackMapById.set(t.id, t);
        if (t.url) {
          trackMapByUrl.set(t.url, t);
          const m = t.url.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
          if (m) trackMapByYtId.set(m[1], t);
        }
      }

      for (const id of activeCustomPlaylist.trackIds) {
        let found = trackMapById.get(id);
        if (!found) {
          if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
            found = trackMapByYtId.get(id);
          } else {
            const ytM = id.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
            if (ytM) found = trackMapByYtId.get(ytM[1]);
          }
        }
        if (!found) {
          found = trackMapByUrl.get(id);
        }
        if (found) list.push(found);
      }
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((t: Track) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [activeCustomPlaylist, tracks, searchQuery]);

  // Auto-heal custom playlists that have missing tracks or were imported earlier
  useEffect(() => {
    let isCancelled = false;
    async function healPlaylists() {
      if (!window.electronAPI?.autoHealPlaylist) return;
      for (const pl of customPlaylists) {
        if ((!pl.tracks || pl.tracks.length === 0) && (pl.trackIds.length > 0 || pl.description?.includes('Diimpor'))) {
          try {
            const rawEntries = await window.electronAPI.autoHealPlaylist(pl.name);
            if (isCancelled) return;
            if (rawEntries && rawEntries.length > 0) {
              const healedTracks: Track[] = rawEntries.map((t: any, idx: number) => {
                const ytIdMatch = (t.url || '').match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
                const ytVideoId = ytIdMatch ? ytIdMatch[1] : null;
                const trackId = ytVideoId || `m3u_${idx}_${encodeURIComponent(t.title || '')}`;
                return {
                  id: trackId,
                  title: t.title || 'Lagu Tanpa Judul',
                  artist: t.artist || 'Unknown Artist',
                  duration: t.duration || 0,
                  sourceType: (t.sourceType || 'm3u') as Track['sourceType'],
                  url: t.url || '',
                  thumbnailUrl: ytVideoId ? `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg` : undefined,
                  preferStudioAudio: true,
                  dateAdded: Date.now(),
                };
              });

              setPlaylistTracks(pl.id, healedTracks);
              addTracks(healedTracks);
            }
          } catch (e) {
            console.warn('Auto-heal failed for playlist:', pl.name, e);
          }
        }
      }
    }

    healPlaylists();
    return () => {
      isCancelled = true;
    };
  }, [customPlaylists, setPlaylistTracks, addTracks]);

  const {
    activeMode: sleepTimerMode,
    startTimer: setSleepTimer,
    cancelTimer: cancelSleepTimer,
    formatCountdown: sleepTimerFormatted,
    handleTrackEnded: handleSleepTrackEnded,
  } = useSleepTimer({
    isPlaying,
    onTimerExpired: () => {
      pause();
    },
    currentVolume: volume,
    onVolumeChange: setVolume,
  });

  // Reset crossfade tracking triggers whenever current track index changes
  useEffect(() => {
    hasCrossfadedThisTrackRef.current = false;
    isPrefetchingNextRef.current = false;
  }, [currentTrackIndex]);

  // Track playback logic with high performance direct CDN resolution and prefetching
  const playTrackAtIndex = useCallback(
    async (index: number) => {
      if (index < 0 || index >= queue.length) return;
      const reqId = ++playRequestIdRef.current;
      setCurrentTrackIndex(index);
      setIsBuffering(true);

      const track = queue[index];
      try {
        const playableUrl = await resolvePlayableUrl(track);
        if (reqId !== playRequestIdRef.current) return;

        loadSource(playableUrl);
        await play();

        // Background pre-fetch next track relative to the newly played track and preload standby deck
        const nextIdx = getNextIndex(index);
        if (nextIdx !== null && nextIdx >= 0 && nextIdx < queue.length) {
          const nextTrack = queue[nextIdx];
          prefetchTrackStream(nextTrack)
            .then((nextUrl) => {
              if (nextUrl) {
                preloadStandbySource(nextUrl);
              }
            })
            .catch(() => {});

          const afterNextIdx = getNextIndex(nextIdx);
          if (afterNextIdx !== null && afterNextIdx >= 0 && afterNextIdx < queue.length) {
            prefetchTrackStream(queue[afterNextIdx]).catch(() => {});
          }
        }
      } catch (err) {
        if (reqId !== playRequestIdRef.current) return;
        console.error('Playback failed:', err);
        setIsBuffering(false);
      }
    },
    [
      queue,
      setCurrentTrackIndex,
      setIsBuffering,
      resolvePlayableUrl,
      loadSource,
      play,
      getNextIndex,
      prefetchTrackStream,
      preloadStandbySource,
    ]
  );

  // Smooth Crossfade Transition to next/specific track
  const performCrossfadeToTrack = useCallback(
    async (index: number, fadeDuration: number) => {
      if (index < 0 || index >= queue.length) return;
      const reqId = ++playRequestIdRef.current;
      const nextTrack = queue[index];

      try {
        const playableUrl = await resolvePlayableUrl(nextTrack);
        if (reqId !== playRequestIdRef.current) return;

        // Perform audio engine dual-deck crossfade
        await crossfadeTo(playableUrl, fadeDuration);

        // Advance track index in React state immediately so UI updates
        setCurrentTrackIndex(index);

        // Pre-fetch following track for subsequent smooth transitions
        const followingIdx = getNextIndex(index);
        if (followingIdx !== null && followingIdx >= 0 && followingIdx < queue.length) {
          const followingTrack = queue[followingIdx];
          prefetchTrackStream(followingTrack)
            .then((follUrl) => {
              if (follUrl) {
                preloadStandbySource(follUrl);
              }
            })
            .catch(() => {});

          const nextAfterFoll = getNextIndex(followingIdx);
          if (nextAfterFoll !== null && nextAfterFoll >= 0 && nextAfterFoll < queue.length) {
            prefetchTrackStream(queue[nextAfterFoll]).catch(() => {});
          }
        }
      } catch (err) {
        if (reqId !== playRequestIdRef.current) return;
        console.warn('Crossfade transition error, falling back to direct play:', err);
        playTrackAtIndex(index);
      }
    },
    [
      queue,
      resolvePlayableUrl,
      crossfadeTo,
      setCurrentTrackIndex,
      getNextIndex,
      playTrackAtIndex,
      prefetchTrackStream,
      preloadStandbySource,
    ]
  );

  // Real-time playback progress handler for auto-crossfade triggering
  const handlePlaybackProgress = useCallback(
    (curTime: number, dur: number) => {
      if (!isPlaying || dur <= 0 || !crossfadeSettings.enabled || crossfadeSettings.duration <= 0) {
        return;
      }

      const timeLeft = dur - curTime;
      // Skip if song is very short (< 8s) or already finished
      if (dur < 8 || timeLeft <= 0) return;

      // 1. Pre-fetch / pre-resolve URL 4 seconds before crossfade threshold
      if (timeLeft <= crossfadeSettings.duration + 4 && !isPrefetchingNextRef.current) {
        isPrefetchingNextRef.current = true;
        const nextIdx = getNextIndex();
        if (nextIdx !== null && nextIdx >= 0 && nextIdx < queue.length) {
          resolvePlayableUrl(queue[nextIdx]).catch(() => {});
        }
      }

      // 2. Trigger auto-crossfade
      if (timeLeft <= crossfadeSettings.duration && !hasCrossfadedThisTrackRef.current) {
        const nextIdx = getNextIndex();
        if (nextIdx !== null && nextIdx >= 0 && nextIdx < queue.length) {
          hasCrossfadedThisTrackRef.current = true;
          performCrossfadeToTrack(nextIdx, Math.min(crossfadeSettings.duration, timeLeft));
        }
      }
    },
    [isPlaying, crossfadeSettings, queue, getNextIndex, resolvePlayableUrl, performCrossfadeToTrack]
  );
  handlePlaybackProgressRef.current = handlePlaybackProgress;

  const handleNext = useCallback(() => {
    handleSleepTrackEnded();
    const nextIdx = getNextIndex();
    if (nextIdx !== null) {
      playTrackAtIndex(nextIdx);
    } else {
      pause();
    }
  }, [handleSleepTrackEnded, getNextIndex, playTrackAtIndex, pause]);

  const handlePrev = useCallback(() => {
    const prevIdx = getPrevIndex();
    if (prevIdx !== null) {
      playTrackAtIndex(prevIdx);
    }
  }, [getPrevIndex, playTrackAtIndex]);

  // Assign track ended handler
  handleTrackEndedRef.current = handleNext;

  const handleSelectTrack = useCallback(
    async (id: string) => {
      // Determine what list the user is currently interacting with
      const currentList = activeMainView === 'custom_playlist' ? customPlaylistTracks : filteredTracks;
      let idx = currentList.findIndex((t) => t.id === id);
      let targetTrack: Track | undefined;

      if (idx !== -1) {
        targetTrack = currentList[idx];
      } else {
        // Fallback: check in active queue
        const qIdx = queue.findIndex((t) => t.id === id);
        if (qIdx !== -1) {
          idx = qIdx;
          targetTrack = queue[qIdx];
        }
      }

      if (!targetTrack || idx === -1) return;

      // If already playing this track, toggle play/pause
      if (currentTrack?.id === targetTrack.id || (currentTrack?.url && currentTrack.url === targetTrack.url)) {
        togglePlay();
        return;
      }

      // Activate the clicked list as the active queue so subsequent Next/Prev stays inside this list
      const listToPlay = idx < currentList.length && currentList[idx]?.id === targetTrack.id ? currentList : queue;
      const targetIdx = listToPlay.findIndex((t) => t.id === targetTrack!.id);
      const safeIdx = targetIdx !== -1 ? targetIdx : 0;

      playPlaylistAtomic(listToPlay, safeIdx);
      setIsBuffering(true);
      const reqId = ++playRequestIdRef.current;

      try {
        const playableUrl = await resolvePlayableUrl(targetTrack);
        if (reqId !== playRequestIdRef.current) return;
        loadSource(playableUrl);
        await play();

        // Background prefetch next track in this list and preload standby deck
        const nextIdx = safeIdx + 1;
        if (nextIdx < listToPlay.length) {
          const nextTrack = listToPlay[nextIdx];
          prefetchTrackStream(nextTrack)
            .then((nextUrl) => {
              if (nextUrl) {
                preloadStandbySource(nextUrl);
              }
            })
            .catch(() => {});

          if (nextIdx + 1 < listToPlay.length) {
            prefetchTrackStream(listToPlay[nextIdx + 1]).catch(() => {});
          }
        }
      } catch (err) {
        if (reqId !== playRequestIdRef.current) return;
        console.error('Failed to play track:', err);
        setIsBuffering(false);
      }
    },
    [
      activeMainView,
      customPlaylistTracks,
      filteredTracks,
      queue,
      currentTrack,
      togglePlay,
      playPlaylistAtomic,
      setIsBuffering,
      resolvePlayableUrl,
      loadSource,
      play,
      prefetchTrackStream,
      preloadStandbySource,
    ]
  );

  // Play an external track directly from YouTube Music View
  const handlePlayExternalTrack = useCallback(
    async (track: Track) => {
      const reqId = ++playRequestIdRef.current;
      playTrackAtomic(track);
      setIsBuffering(true);

      try {
        const playableUrl = await resolvePlayableUrl(track);
        if (reqId !== playRequestIdRef.current) return;

        if (isPlaying && crossfadeSettings.enabled && crossfadeSettings.duration > 0) {
          await crossfadeTo(playableUrl, 0.6);
        } else {
          loadSource(playableUrl);
          await play();
        }
      } catch (err) {
        if (reqId !== playRequestIdRef.current) return;
        console.error('Failed to play external track:', err);
        setIsBuffering(false);
      }
    },
    [playTrackAtomic, setIsBuffering, resolvePlayableUrl, loadSource, play, isPlaying, crossfadeSettings, crossfadeTo]
  );

  // Global toast feedback system
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Play a track next in queue (Putar Berikutnya)
  const handlePlayNext = useCallback(
    (track: Track) => {
      playNextInQueue(track);
      showToast(`"${track.title}" akan diputar berikutnya`);
    },
    [playNextInQueue, showToast]
  );

  // Add tracks to queue with feedback
  const handleAddToQueue = useCallback(
    (tracksToAdd: Track[]) => {
      addToQueue(tracksToAdd);
      if (tracksToAdd.length === 1) {
        showToast(`"${tracksToAdd[0].title}" ditambahkan ke antrean`);
      } else if (tracksToAdd.length > 1) {
        showToast(`${tracksToAdd.length} lagu ditambahkan ke antrean`);
      }
    },
    [addToQueue, showToast]
  );

  // Play an entire playlist from YouTube Music View or TrackList
  const handlePlayPlaylist = useCallback(
    async (playlistTracksToPlay: Track[], startIndex: number = 0) => {
      if (!playlistTracksToPlay || playlistTracksToPlay.length === 0) return;
      const safeStart = Math.max(0, Math.min(playlistTracksToPlay.length - 1, startIndex));
      const reqId = ++playRequestIdRef.current;
      playPlaylistAtomic(playlistTracksToPlay, safeStart);
      setIsBuffering(true);

      const targetTrack = playlistTracksToPlay[safeStart];
      try {
        const playableUrl = await resolvePlayableUrl(targetTrack);
        if (reqId !== playRequestIdRef.current) return;

        loadSource(playableUrl);
        await play();

        // Pre-fetch track + 1 and preload standby deck for zero latency continuation
        if (safeStart + 1 < playlistTracksToPlay.length) {
          const nextTrack = playlistTracksToPlay[safeStart + 1];
          prefetchTrackStream(nextTrack)
            .then((nextUrl) => {
              if (nextUrl) {
                preloadStandbySource(nextUrl);
              }
            })
            .catch(() => {});

          if (safeStart + 2 < playlistTracksToPlay.length) {
            prefetchTrackStream(playlistTracksToPlay[safeStart + 2]).catch(() => {});
          }
        }
      } catch (err) {
        if (reqId !== playRequestIdRef.current) return;
        console.error('Failed to play playlist:', err);
        setIsBuffering(false);
      }
    },
    [playPlaylistAtomic, setIsBuffering, resolvePlayableUrl, loadSource, play, prefetchTrackStream, preloadStandbySource]
  );

  // Play an entire playlist shuffled
  const handlePlayPlaylistShuffled = useCallback(
    async (playlistTracksToPlay: Track[]) => {
      if (!playlistTracksToPlay || playlistTracksToPlay.length === 0) return;
      const reqId = ++playRequestIdRef.current;

      const randomIdx = Math.floor(Math.random() * playlistTracksToPlay.length);
      const chosenTrack = playlistTracksToPlay[randomIdx];

      playPlaylistShuffled(playlistTracksToPlay, randomIdx);
      setIsBuffering(true);

      try {
        const playableUrl = await resolvePlayableUrl(chosenTrack);
        if (reqId !== playRequestIdRef.current) return;

        loadSource(playableUrl);
        await play();
      } catch (err) {
        if (reqId !== playRequestIdRef.current) return;
        console.error('Failed to play shuffled playlist:', err);
        setIsBuffering(false);
      }
    },
    [playPlaylistShuffled, setIsBuffering, resolvePlayableUrl, loadSource, play]
  );

  // Start batch download and immediately show them in the playlist / download list
  const handleStartBatchDownload = useCallback(
    (tracksToDownload: Track[]) => {
      setTracks((prev) => {
        const existingMap = new Map(prev.map((t) => [t.id, t]));
        const nextList = [...prev];

        for (const t of tracksToDownload) {
          if (!existingMap.has(t.id)) {
            nextList.push({
              ...t,
              isOffline: false,
              downloadStatus: 'downloading',
              downloadProgress: 0,
              dateAdded: Date.now(),
            });
          } else {
            const existing = existingMap.get(t.id)!;
            if (!existing.isOffline) {
              const idx = nextList.findIndex((item) => item.id === t.id);
              if (idx !== -1) {
                nextList[idx] = {
                  ...nextList[idx],
                  downloadStatus: 'downloading',
                  downloadProgress: 0,
                };
              }
            }
          }
        }
        return nextList;
      });

      startBatchDownload(tracksToDownload);
    },
    [setTracks, startBatchDownload]
  );

  // Remove track from playlist and also delete physical file if downloaded
  const handleRemoveTrack = useCallback(
    (id: string) => {
      removeTrack(id);
      removeDownload(id);
    },
    [removeTrack, removeDownload]
  );

  const handleOpenCreatePlaylistModal = useCallback((initialTrackIds?: string[]) => {
    setPlaylistModalTargetTrackIds(initialTrackIds || []);
    setPlaylistModalMode('create');
    setIsPlaylistModalOpen(true);
  }, []);

  const handleOpenAddToPlaylistModal = useCallback((targetTrackIds: string[]) => {
    setPlaylistModalTargetTrackIds(targetTrackIds);
    setPlaylistModalMode('add_to');
    setIsPlaylistModalOpen(true);
  }, []);

  // When adding tracks directly from YTMusicView
  const handleAddExternalTracksToPlaylist = useCallback(
    (newTracks: Track[]) => {
      addTracks(newTracks);
      setPlaylistModalTargetTrackIds(newTracks.map((t) => t.id));
      setPlaylistModalMode('add_to');
      setIsPlaylistModalOpen(true);
    },
    [addTracks]
  );

  const handleCreatePlaylist = useCallback(
    (name: string, description?: string, initialTrackIds?: string[]) => {
      const initialTracks = (initialTrackIds || [])
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => Boolean(t));
      const newPlaylist = createPlaylist(name, description, initialTracks);
      setActiveCustomPlaylistId(newPlaylist.id);
      setActiveMainView('custom_playlist');
    },
    [createPlaylist, tracks]
  );

  const handleImportAsPlaylist = useCallback(
    (
      playlistName: string,
      importedTracks: Track[],
      options: { createAsPlaylist: boolean; preferStudioAudio: boolean }
    ) => {
      const preparedTracks = options.preferStudioAudio
        ? importedTracks.map((t) => ({ ...t, preferStudioAudio: true }))
        : importedTracks;

      addTracks(preparedTracks);

      if (options.createAsPlaylist && playlistName.trim()) {
        const trimmedName = playlistName.trim();
        const existingPl = customPlaylists.find(
          (p) =>
            p.name.toLowerCase() === trimmedName.toLowerCase() ||
            (p.id === activeCustomPlaylistId && (!p.tracks || p.tracks.length === 0))
        );

        if (existingPl) {
          setPlaylistTracks(existingPl.id, preparedTracks);
          setActiveCustomPlaylistId(existingPl.id);
        } else {
          const newPlaylist = createPlaylist(
            trimmedName,
            `Diimpor dari file playlist (${preparedTracks.length} lagu)`,
            preparedTracks
          );
          setActiveCustomPlaylistId(newPlaylist.id);
        }
        setActiveMainView('custom_playlist');
      }
    },
    [
      addTracks,
      createPlaylist,
      setPlaylistTracks,
      customPlaylists,
      activeCustomPlaylistId,
      setActiveCustomPlaylistId,
      setActiveMainView,
    ]
  );

  const handleAddToPlaylist = useCallback(
    (playlistId: string, trackIds: string[]) => {
      const trackObjects = trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => Boolean(t));
      addTracksToPlaylist(playlistId, trackIds, trackObjects);
    },
    [addTracksToPlaylist, tracks]
  );

  const handleDeleteCustomPlaylist = useCallback(
    (id: string) => {
      deletePlaylist(id);
      if (activeCustomPlaylistId === id) {
        setActiveCustomPlaylistId(null);
        setActiveMainView('library');
      }
    },
    [deletePlaylist, activeCustomPlaylistId]
  );

  const handleSelectCustomPlaylist = useCallback((id: string) => {
    setSearchQuery('');
    setActiveCustomPlaylistId(id);
    setActiveMainView('custom_playlist');
  }, [setSearchQuery]);

  const handleRemoveTrackFromActiveView = useCallback(
    (id: string) => {
      if (activeMainView === 'custom_playlist' && activeCustomPlaylistId) {
        removeTrackFromPlaylist(activeCustomPlaylistId, id);
      } else {
        handleRemoveTrack(id);
      }
    },
    [activeMainView, activeCustomPlaylistId, removeTrackFromPlaylist, handleRemoveTrack]
  );

  const handleRemoveTracksFromActiveView = useCallback(
    (ids: string[]) => {
      if (activeMainView === 'custom_playlist' && activeCustomPlaylistId) {
        removeTracksFromPlaylist(activeCustomPlaylistId, ids);
      } else {
        ids.forEach((id) => handleRemoveTrack(id));
      }
    },
    [activeMainView, activeCustomPlaylistId, removeTracksFromPlaylist, handleRemoveTrack]
  );

  const handleTogglePlay = useCallback(() => {
    if (!currentTrack) {
      if (queue.length > 0) {
        playTrackAtIndex(0);
      } else if (tracks.length > 0) {
        handlePlayPlaylist(tracks, 0);
      }
      return;
    }
    togglePlay();
  }, [currentTrack, queue.length, tracks, playTrackAtIndex, handlePlayPlaylist, togglePlay]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName.toLowerCase();
      if (activeEl === 'input' || activeEl === 'textarea' || activeEl === 'select') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsEqualizerOpen((prev) => !prev);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsQueueOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, seek, duration, currentTime, setVolume, volume, toggleMute]);

  // Windows Media Controls (SMTC) & Physical Media Keys
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'AuraAudio',
        artwork: currentTrack.thumbnailUrl
          ? [
              { src: currentTrack.thumbnailUrl, sizes: '96x96', type: 'image/png' },
              { src: currentTrack.thumbnailUrl, sizes: '128x128', type: 'image/png' },
              { src: currentTrack.thumbnailUrl, sizes: '256x256', type: 'image/png' },
              { src: currentTrack.thumbnailUrl, sizes: '512x512', type: 'image/png' },
            ]
          : [],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      handlePrev();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      handleNext();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        seek(details.seekTime);
      }
    });

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {}
    };
  }, [currentTrack, isPlaying, play, pause, handlePrev, handleNext, seek]);

  // Sync position state with MediaSession
  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    if (duration > 0 && isFinite(duration) && isFinite(currentTime)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: Math.min(currentTime, duration),
        });
      } catch {}
    }
  }, [currentTime, duration]);

  // Mini Player State Sync
  useEffect(() => {
    if (window.electronAPI?.sendMiniState) {
      window.electronAPI.sendMiniState({
        currentTrack,
        isPlaying,
        currentTime,
        duration,
      });
    }
  }, [currentTrack, isPlaying, currentTime, duration]);

  // Mini Player Action & Tray Action Listeners
  useEffect(() => {
    const unsubMini = window.electronAPI?.onMiniAction?.((action, payload) => {
      if (action === 'play') play();
      else if (action === 'pause') pause();
      else if (action === 'next') handleNext();
      else if (action === 'prev') handlePrev();
      else if (action === 'seek' && typeof payload === 'number') seek(payload);
    });

    const unsubTray = window.electronAPI?.onTrayAction?.((action) => {
      if (action === 'play-pause') handleTogglePlay();
      else if (action === 'next') handleNext();
      else if (action === 'prev') handlePrev();
    });

    return () => {
      unsubMini?.();
      unsubTray?.();
    };
  }, [play, pause, handleNext, handlePrev, seek, handleTogglePlay]);

  const openImportModalWithTab = (tab: 'youtube' | 'playlist' | 'local' | 'spotify' = 'youtube') => {
    setImportInitialTab(tab);
    setIsImportModalOpen(true);
  };

  // Dynamic Aura Cover Colors & Lighting Opacity
  // Gradasi selalu mengikuti lagu yang sedang diputar (currentTrack), bukan playlist
  const currentTrackCoverUrl = useTrackCover(
    currentTrack?.title || '',
    currentTrack?.artist || '',
    currentTrack?.thumbnailUrl
  );
  const coverColors = useCoverColors(currentTrackCoverUrl || currentTrack?.thumbnailUrl);
  const dynamicLightOpacity = !settings.dynamicLighting.enabled
    ? 0
    : settings.dynamicLighting.intensity === 'subtle'
    ? 0.18
    : settings.dynamicLighting.intensity === 'vibrant'
    ? 0.48
    : 0.32;

  const handleUpdateSettings = useCallback(
    (newSettings: AppSettings) => {
      setSettings(newSettings);
      try {
        localStorage.setItem('aura_app_settings', JSON.stringify(newSettings));
      } catch {}

      if (
        newSettings.audio.crossfadeEnabled !== crossfadeSettings.enabled ||
        newSettings.audio.crossfadeDuration !== crossfadeSettings.duration
      ) {
        updateCrossfadeSettings({
          enabled: newSettings.audio.crossfadeEnabled,
          duration: newSettings.audio.crossfadeDuration,
        });
      }
    },
    [crossfadeSettings, updateCrossfadeSettings]
  );

  const handleCrossfadeChangeFromEQ = useCallback(
    (newCf: Partial<CrossfadeSettings>) => {
      updateCrossfadeSettings(newCf);
      setSettings((prev) => {
        const next = {
          ...prev,
          audio: {
            ...prev.audio,
            crossfadeEnabled: newCf.enabled !== undefined ? newCf.enabled : prev.audio.crossfadeEnabled,
            crossfadeDuration: newCf.duration !== undefined ? newCf.duration : prev.audio.crossfadeDuration,
          },
        };
        try {
          localStorage.setItem('aura_app_settings', JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [updateCrossfadeSettings]
  );

  return (
    <div
      className="grid grid-cols-[88px_1fr] grid-rows-[32px_1fr_88px] h-screen w-screen overflow-hidden bg-[#0B0B0C] text-[#F4F4F0] font-sans select-none relative"
      style={
        {
          background: settings.dynamicLighting.enabled
            ? 'radial-gradient(900px 520px at 65% 0%, color-mix(in srgb, var(--now) 18%, transparent), transparent 70%), var(--bg)'
            : 'var(--bg)',
          '--now': coverColors.primary || '#6B7F94',
          '--now-dark': coverColors.dark || '#20262c',
        } as React.CSSProperties
      }
    >
      {/* Row 1: Custom Title Bar 32px (col-span-2) */}
      <TitleBar />

      {/* Playback Error Toast Alert */}
      {playbackError && (
        <div className="fixed top-12 right-5 z-50 flex items-center gap-3 bg-[#1F1F23] text-[#F4F4F0] px-4 py-3 rounded-[8px] shadow-2xl animate-in fade-in slide-in-from-top duration-200 max-w-md">
          <AlertCircle size={18} className="text-[#E07A7A] flex-shrink-0" />
          <div className="text-xs min-w-0 flex-1">
            <p className="font-semibold text-[#F4F4F0]">Gagal Memutar Lagu</p>
            <p className="text-[#8D8D93] text-[11px] truncate mt-0.5">{playbackError}</p>
          </div>
          <button
            onClick={clearPlaybackError}
            className="p-1.5 hover:bg-[#34343A] rounded-[6px] text-[#8D8D93] hover:text-[#F4F4F0] transition-colors flex-shrink-0 cursor-pointer"
            title="Tutup Pesan"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Hidden Dual-Deck Audio Elements with CORS enabled */}
      <audio ref={audioRefA} crossOrigin="anonymous" preload="auto" />
      <audio ref={audioRefB} crossOrigin="anonymous" preload="auto" />

      {/* Col 1, Row 2: Sidebar Rail (88px wide fixed) */}
      <Sidebar
        currentFilter={filter}
        onFilterChange={(newFilter) => {
          setFilter(newFilter);
          setSearchQuery('');
          if (newFilter === 'offline') {
            setActiveMainView('library');
            setSelectedLibraryPlaylist('offline');
          } else {
            setSelectedLibraryPlaylist(null);
          }
        }}
        tracks={tracks}
        onOpenImportModal={openImportModalWithTab}
        userProfile={userProfile}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        activeView={activeMainView}
        onViewChange={(view) => {
          if (view === 'library') {
            setSearchQuery('');
            setSelectedLibraryPlaylist(null);
          }
          setActiveMainView(view);
        }}
        ytSubTab={ytSubTab}
        onYtSubTabChange={setYtSubTab}
        customPlaylists={customPlaylists}
        activeCustomPlaylistId={activeCustomPlaylistId}
        onSelectCustomPlaylist={handleSelectCustomPlaylist}
        onOpenCreatePlaylist={() => handleOpenCreatePlaylistModal()}
        onDeleteCustomPlaylist={handleDeleteCustomPlaylist}
        onDownloadBatch={handleStartBatchDownload}
        isQueueOpen={isQueueOpen}
        onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
      />

      {/* Col 2, Row 1: Main Content Container (TopBar + Scrollable Active View) */}
      <div className="flex flex-col h-full overflow-hidden relative">
        <TopBar
          activeView={activeMainView}
          onViewChange={(view) => {
            if (view === 'library') {
              setSearchQuery('');
              setSelectedLibraryPlaylist(null);
            }
            setActiveMainView(view);
          }}
          ytSubTab={ytSubTab}
          searchQuery={activeMainView === 'ytmusic' ? ytSearchQuery : searchQuery}
          onSearchChange={(q) => {
            if (activeMainView === 'ytmusic') {
              setYtSearchQuery(q);
            } else {
              setSearchQuery(q);
            }
          }}
          onSearchSubmit={(query) => {
            const trimmed = query.trim();
            if (trimmed) {
              setYtSearchQuery(trimmed);
              setYtSubTab('search');
              setActiveMainView('ytmusic');
            }
          }}
          userProfile={userProfile}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onPlayTrack={handlePlayExternalTrack}
          canGoBack={Boolean(
            activeMainView === 'custom_playlist' ||
            (activeMainView === 'library' && selectedLibraryPlaylist !== null)
          )}
          onHistoryBack={() => {
            if (activeMainView === 'custom_playlist') {
              setActiveMainView('library');
              setSelectedLibraryPlaylist(null);
            } else if (activeMainView === 'library' && selectedLibraryPlaylist !== null) {
              setSelectedLibraryPlaylist(null);
            }
          }}
          titleOverride={
            activeMainView === 'custom_playlist'
              ? activeCustomPlaylist?.name || 'Playlist'
              : activeMainView === 'library' && selectedLibraryPlaylist === 'all'
              ? 'Semua Lagu'
              : activeMainView === 'library' && selectedLibraryPlaylist === 'offline'
              ? 'Tersimpan Offline'
              : undefined
          }
        />

        <div className="flex flex-1 overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {activeMainView === 'stage' ? (
              <LiveStageView
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onNext={handleNext}
                onPrev={handlePrev}
                analyserNode={analyserRef.current}
                upcomingTrack={(() => {
                  const nextIdx = getNextIndex();
                  return nextIdx !== null ? queue[nextIdx] : null;
                })()}
                onOpenEqualizer={() => setIsEqualizerOpen(true)}
                onOpenQueue={() => setIsQueueOpen(true)}
                onStartDownload={startDownload}
                onOpenAddToPlaylist={(t) => handleOpenAddToPlaylistModal([t.id])}
              />
            ) : activeMainView === 'ytmusic' ? (
              <YTMusicView
                userProfile={userProfile}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                onPlayTrack={handlePlayExternalTrack}
                onPlayPlaylist={handlePlayPlaylist}
                onPlayShuffled={handlePlayPlaylistShuffled}
                onPlayNext={handlePlayNext}
                onAddTracksToQueue={handleAddToQueue}
                onStartDownload={startDownload}
                onDownloadBatch={handleStartBatchDownload}
                onOpenAddToPlaylistModal={handleAddExternalTracksToPlaylist}
                activeTab={ytSubTab}
                onTabChange={setYtSubTab}
                externalSearchQuery={ytSearchQuery}
                onExternalSearchChange={setYtSearchQuery}
                customPlaylists={customPlaylists}
                libraryTracks={tracks}
                onSelectCustomPlaylist={handleSelectCustomPlaylist}
                onViewChange={setActiveMainView}
                dynamicLighting={settings.dynamicLighting}
                activeColor={coverColors.primary}
              />
            ) : activeMainView === 'custom_playlist' ? (
              <TrackList
                tracks={customPlaylistTracks}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectTrack={handleSelectTrack}
                onPlayPlaylist={handlePlayPlaylist}
                onPlayShuffled={handlePlayPlaylistShuffled}
                onPlayNext={handlePlayNext}
                onRemoveTrack={handleRemoveTrackFromActiveView}
                onRemoveTracks={handleRemoveTracksFromActiveView}
                onStartDownload={startDownload}
                onDownloadBatch={handleStartBatchDownload}
                onAddTracksToQueue={handleAddToQueue}
                onOpenImportModal={openImportModalWithTab}
                currentFilter={filter}
                customPlaylist={activeCustomPlaylist}
                onDeleteCustomPlaylist={handleDeleteCustomPlaylist}
                onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                onBackToLibrary={() => {
                  setActiveMainView('library');
                  setSelectedLibraryPlaylist(null);
                }}
                dynamicLighting={settings.dynamicLighting}
              />
            ) : activeMainView === 'library' && selectedLibraryPlaylist === null ? (
              <LibraryGridView
                tracks={tracks}
                customPlaylists={customPlaylists}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onSelectPlaylist={(plId) => {
                  if (plId === 'all') {
                    setSelectedLibraryPlaylist('all');
                    setFilter('all');
                  } else if (plId === 'offline') {
                    setSelectedLibraryPlaylist('offline');
                    setFilter('offline');
                  } else {
                    handleSelectCustomPlaylist(plId);
                  }
                }}
                onPlayPlaylist={handlePlayPlaylist}
                onOpenCreatePlaylist={() => handleOpenCreatePlaylistModal()}
                onOpenImportModal={openImportModalWithTab}
                onDeleteCustomPlaylist={handleDeleteCustomPlaylist}
                searchQuery={searchQuery}
              />
            ) : (
              <TrackList
                tracks={
                  selectedLibraryPlaylist === 'offline'
                    ? tracks.filter((t) => t.isOffline || t.sourceType === 'local')
                    : filteredTracks
                }
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectTrack={handleSelectTrack}
                onPlayPlaylist={handlePlayPlaylist}
                onPlayShuffled={handlePlayPlaylistShuffled}
                onPlayNext={handlePlayNext}
                onRemoveTrack={handleRemoveTrackFromActiveView}
                onRemoveTracks={handleRemoveTracksFromActiveView}
                onStartDownload={startDownload}
                onDownloadBatch={handleStartBatchDownload}
                onAddTracksToQueue={handleAddToQueue}
                onOpenImportModal={openImportModalWithTab}
                currentFilter={selectedLibraryPlaylist === 'offline' ? 'offline' : filter}
                onOpenAddToPlaylistModal={handleOpenAddToPlaylistModal}
                onBackToLibrary={() => setSelectedLibraryPlaylist(null)}
                dynamicLighting={settings.dynamicLighting}
              />
            )}
          </div>

          {/* Contextual Overview Panel */}
          {isOverviewOpen && (
            <PlaylistOverviewPanel
              currentTrack={currentTrack}
              activePlaylistTitle={
                activeMainView === 'custom_playlist' && activeCustomPlaylist
                  ? activeCustomPlaylist.name
                  : activeMainView === 'library'
                  ? 'Koleksi Library'
                  : 'YouTube Music'
              }
              userProfile={userProfile}
              isOpen={isOverviewOpen}
              onClose={() => setIsOverviewOpen(false)}
              trackCount={queue.length > 0 ? queue.length : tracks.length}
              dynamicLighting={settings.dynamicLighting}
            />
          )}
        </div>
      </div>

      {/* Row 2: PlayerBar spanning 2 columns */}
      <div className="col-span-2 w-full h-[88px] z-30">
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          bufferedTime={bufferedTime}
          volume={volume}
          isMuted={isMuted}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          isEqualizerOpen={isEqualizerOpen}
          isQueueOpen={isQueueOpen}
          sleepTimerActive={Boolean(sleepTimerMode)}
          sleepTimerFormatted={sleepTimerFormatted()}
          onSetSleepTimer={setSleepTimer}
          onCancelSleepTimer={cancelSleepTimer}
          onToggleMiniPlayer={() => {
            if (window.electronAPI?.openMiniPlayer) {
              window.electronAPI.openMiniPlayer();
            }
          }}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleEqualizer={() => setIsEqualizerOpen((prev) => !prev)}
          onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
          isOverviewOpen={isOverviewOpen}
          onToggleOverview={() => setIsOverviewOpen((prev) => !prev)}
          onStartDownload={startDownload}
        />
      </div>

      {/* Slide-out Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        tracks={queue}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onSelectTrack={handleSelectTrack}
        onRemoveTrack={removeFromQueue}
        onClearQueue={clearQueue}
        onStartDownload={startDownload}
      />

      {/* 8-Band Equalizer Drawer */}
      <Equalizer
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        bands={bands}
        currentPreset={currentPreset}
        onBandChange={setBandGain}
        onPresetSelect={applyPreset}
        onReset={resetEQ}
        analyserNode={analyserRef.current}
        isPlaying={isPlaying}
        crossfadeSettings={crossfadeSettings}
        onCrossfadeChange={handleCrossfadeChangeFromEQ}
      />

      {/* Floating Batch Download Progress Pill */}
      {batchProgress && (
        <div className="fixed bottom-24 right-6 z-40 bg-[#17171A] text-[#F4F4F0] px-4 py-3 rounded-[10px] shadow-2xl flex items-center gap-3.5 max-w-sm animate-in fade-in slide-in-from-bottom duration-200">
          <div className="w-9 h-9 rounded-[8px] bg-[#1C1C1F] flex items-center justify-center flex-shrink-0 text-[#F4F4F0]">
            <Download size={17} className={batchProgress.active ? 'animate-bounce text-[#B7C9A8]' : ''} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#F4F4F0] truncate">
                {batchProgress.active ? 'Mengunduh Playlist...' : 'Unduhan Selesai'}
              </span>
              <span className="text-[#8D8D93] font-mono text-[11px] ml-2 flex-shrink-0">
                {batchProgress.completed}/{batchProgress.total} ({batchProgress.overallPercent}%)
              </span>
            </div>
            <div className="w-full bg-[#2A2A2E] h-1.5 rounded-[2px] overflow-hidden">
              <div
                className="bg-[#B7C9A8] h-full transition-all duration-300 rounded-[2px]"
                style={{ width: `${batchProgress.overallPercent}%` }}
              />
            </div>
            {batchProgress.currentTitle && (
              <p className="text-[10px] text-[#8D8D93] truncate mt-1">
                {batchProgress.currentTitle}
              </p>
            )}
          </div>
          {batchProgress.active && (
            <button
              onClick={cancelBatchDownload}
              className="p-1.5 hover:bg-[#1C1C1F] text-[#8D8D93] hover:text-[#F4F4F0] rounded-[6px] transition-colors flex-shrink-0 cursor-pointer"
              title="Batalkan Unduhan"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#17171A] text-[#F4F4F0] px-5 py-2.5 rounded-[8px] shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-200 pointer-events-none">
          <CheckCircle2 size={16} className="text-[#F4F4F0] flex-shrink-0" />
          <span className="text-xs font-medium text-[#F4F4F0]">{toastMessage}</span>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        initialTab={importInitialTab}
        onClose={() => setIsImportModalOpen(false)}
        onAddTracks={addTracks}
        onImportAsPlaylist={handleImportAsPlaylist}
        onStartDownload={startDownload}
      />

      {/* Auth Modal for Local Account */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userProfile={userProfile}
        onProfileUpdated={setUserProfile}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        userProfile={userProfile}
        onOpenAuthModal={() => {
          setIsSettingsModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onOpenEqualizer={() => {
          setIsSettingsModalOpen(false);
          setIsEqualizerOpen(true);
        }}
        previewColors={{ primary: coverColors.primary, secondary: coverColors.secondary }}
      />

      {/* Custom Playlist Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        playlists={customPlaylists}
        onCreatePlaylist={handleCreatePlaylist}
        onAddToPlaylist={handleAddToPlaylist}
        selectedTrackIds={playlistModalTargetTrackIds}
        initialMode={playlistModalMode}
      />
    </div>
  );
}
export default App;
