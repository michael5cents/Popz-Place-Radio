// Get DOM elements
const player = document.getElementById('player');
const status = document.getElementById('status');
const playButton = document.getElementById('play-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const shuffleButton = document.getElementById('shuffle-button');
const stopButton = document.getElementById('stop-button');
const progressBar = document.getElementById('progress-bar');
const progress = document.querySelector('.progress');
const favoriteButton = document.getElementById('favorite-button');
const favoritesListButton = document.getElementById('favorites-list-button');
const favoritesModal = document.getElementById('favorites-modal');
const favoritesList = document.getElementById('favorites-list');
const closeFavoritesButton = document.getElementById('close-favorites');
const playFavoritesButton = document.getElementById('play-favorites-button');
const volumeButton = document.getElementById('volume-button');
const volumeSlider = document.getElementById('volume-slider');
const showTracksButton = document.getElementById('show-tracks-button');
const tracksModal = document.getElementById('tracks-modal');
const closeTracksButton = document.getElementById('close-tracks');
const tracksList = document.getElementById('tracks-list');
const versionButton = document.getElementById('version-button');
const moreControlsBtn = document.getElementById('more-controls-btn');
const controlsExtended = document.getElementById('controls-extended');

// Track list and current track
let tracks = [];
let currentTrack = null;
let isPlaying = false;
let favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
let playingFavorites = false;
let shuffleMode = false;

// Mobile and wake lock support
let wakeLock = null;
let maxRetries = 3;
let currentRetries = 0;

// Audio buffering and stall handling
let bufferCheckInterval = null;
let lastPlayPosition = 0;
let stallCount = 0;
let isBuffering = false;

// Wake Lock API support for mobile devices
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake lock acquired');

            wakeLock.addEventListener('release', () => {
                console.log('Wake lock released');
            });
        }
    } catch (err) {
        console.log('Wake lock not supported or failed:', err);
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('Wake lock manually released');
        } catch (err) {
            console.log('Error releasing wake lock:', err);
        }
    }
}

// Handle visibility changes (mobile sleep mode)
function handleVisibilityChange() {
    if (document.hidden) {
        // Page is hidden (mobile going to sleep)
        console.log('Page hidden - maintaining audio session');
        if (isPlaying && player.src) {
            // Ensure audio continues playing
            player.play().catch(err => {
                console.log('Error maintaining playback:', err);
            });
        }
    } else {
        // Page is visible again
        console.log('Page visible - checking audio state');
        if (isPlaying && player.paused) {
            // Try to resume if we were supposed to be playing
            player.play().catch(err => {
                console.log('Error resuming playback:', err);
                status.textContent = 'Playback interrupted - tap play to resume';
                isPlaying = false;
                updatePlayIcon();
            });
        }
        // Re-acquire wake lock if needed
        if (isPlaying) {
            requestWakeLock();
        }
    }
}

// Audio buffering and stall detection
function startBufferMonitoring() {
    if (bufferCheckInterval) {
        clearInterval(bufferCheckInterval);
    }

    lastPlayPosition = 0;
    stallCount = 0;

    bufferCheckInterval = setInterval(() => {
        if (!isPlaying || !player.src) {
            return;
        }

        const currentPosition = player.currentTime;

        // Check if audio is stalled (position hasn't changed)
        if (currentPosition === lastPlayPosition && !player.paused) {
            stallCount++;

            if (stallCount >= 2) { // 2 seconds of stalling
                console.log('Audio stalled detected, attempting recovery');
                handleAudioStall();
            } else {
                if (!isBuffering) {
                    isBuffering = true;
                    status.textContent = `${currentTrack} - Buffering...`;
                }
            }
        } else {
            // Audio is progressing normally
            stallCount = 0;
            if (isBuffering) {
                isBuffering = false;
                status.textContent = currentTrack;
            }
        }

        lastPlayPosition = currentPosition;
    }, 1000); // Check every second
}

function stopBufferMonitoring() {
    if (bufferCheckInterval) {
        clearInterval(bufferCheckInterval);
        bufferCheckInterval = null;
    }
    isBuffering = false;
    stallCount = 0;
}

// Handle audio stall recovery
async function handleAudioStall() {
    console.log('Attempting to recover from audio stall');

    try {
        const currentTime = player.currentTime;

        // Try to resume playback
        await player.play();

        // If that doesn't work, try seeking slightly forward
        if (player.currentTime === currentTime) {
            player.currentTime = Math.min(currentTime + 0.1, player.duration - 0.1);
            await player.play();
        }

        stallCount = 0;
        isBuffering = false;
        status.textContent = currentTrack;
        console.log('Audio stall recovery successful');

    } catch (error) {
        console.error('Audio stall recovery failed:', error);

        // If recovery fails, try reloading the track
        if (currentTrack) {
            console.log('Attempting track reload for stall recovery');
            const savedTime = player.currentTime;

            try {
                await playTrack(currentTrack);
                // Try to resume from where we left off
                if (savedTime > 0 && savedTime < player.duration) {
                    player.currentTime = savedTime;
                }
            } catch (reloadError) {
                console.error('Track reload failed:', reloadError);
                status.textContent = `Playback error - ${reloadError.message}`;
                isPlaying = false;
                updatePlayIcon();
            }
        }
    }
}

// Update shuffle button appearance
function updateShuffleIcon() {
    const icon = shuffleButton.querySelector('i');
    icon.style.color = shuffleMode ? '#FFD700' : '#fff';
}

// Update play favorites button
function updatePlayFavoritesIcon() {
    const icon = playFavoritesButton.querySelector('i');
    icon.style.color = playingFavorites ? '#FFD700' : '#fff';
}


// Update play button icon
function updatePlayIcon() {
    const icon = playButton.querySelector('i');
    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

// Load and play a track with retry logic
async function playTrack(filename, retryCount = 0) {
    try {
        status.textContent = `Loading ${filename}...`;

        const response = await fetch(`/api/getsasurl/${encodeURIComponent(filename)}`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // Stop any existing buffer monitoring
        stopBufferMonitoring();

        // Set up the audio source (keep it simple)
        player.src = data.url;

        // Wait for the audio to be ready (simplified)
        await new Promise((resolve, reject) => {
            const onCanPlay = () => {
                player.removeEventListener('canplay', onCanPlay);
                player.removeEventListener('error', onError);
                resolve();
            };

            const onError = (e) => {
                player.removeEventListener('canplay', onCanPlay);
                player.removeEventListener('error', onError);
                reject(new Error(`Audio load error: ${e.message || 'Unknown error'}`));
            };

            player.addEventListener('canplay', onCanPlay);
            player.addEventListener('error', onError);

            // Timeout after 10 seconds
            setTimeout(() => {
                player.removeEventListener('canplay', onCanPlay);
                player.removeEventListener('error', onError);
                reject(new Error('Audio load timeout'));
            }, 10000);
        });

        // Play the audio
        await player.play();

        // Update state
        currentTrack = filename;
        isPlaying = true;
        currentRetries = 0; // Reset retry counter on success
        updatePlayIcon();
        updateFavoriteIcon();
        status.textContent = filename;

        // Start buffer monitoring for stall detection
        startBufferMonitoring();

        // Request wake lock for mobile
        if (isPlaying) {
            requestWakeLock();
        }

        console.log(`Successfully playing: ${filename}`);

    } catch (error) {
        console.error(`Error playing ${filename}:`, error);

        // Retry logic
        if (retryCount < maxRetries) {
            console.log(`Retrying ${filename} (attempt ${retryCount + 1}/${maxRetries})`);
            status.textContent = `Retrying ${filename}... (${retryCount + 1}/${maxRetries})`;

            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));

            return await playTrack(filename, retryCount + 1);
        } else {
            // Max retries reached
            isPlaying = false;
            updatePlayIcon();
            status.textContent = `Failed to play ${filename}: ${error.message}`;

            // In shuffle mode, try the next track
            if (shuffleMode && tracks.length > 1) {
                console.log('Shuffle mode: trying next track after failure');
                setTimeout(() => playNext(), 2000);
            }

            throw error;
        }
    }
}

// Load track list
async function loadTracks(favoritesOnly = false) {
    if (tracks.length === 0 || favoritesOnly !== playingFavorites) {
        status.textContent = 'Loading tracks...';
        const response = await fetch('/api/tracks');
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (favoritesOnly) {
            tracks = data.tracks.filter(track => favorites.has(track));
            if (tracks.length === 0) {
                throw new Error('No favorites to play');
            }
        } else {
            tracks = data.tracks;
        }

        playingFavorites = favoritesOnly;
        updatePlayFavoritesIcon();
        updateTracksList(); // Update the tracks list whenever tracks are loaded
    }
    return tracks;
}

// Show all tracks modal
async function showAllTracks() {
    try {
        await loadTracks(false); // Make sure we have all tracks loaded
        updateTracksList();
        tracksModal.style.display = 'block';
    } catch (error) {
        status.textContent = 'Error loading tracks: ' + error.message;
    }
}

// Update the tracks list in the modal
function updateTracksList() {
    tracksList.innerHTML = '';
    // Create a sorted copy of tracks
    const sortedTracks = [...tracks].sort((a, b) => a.localeCompare(b));
    sortedTracks.forEach((track) => {
        const li = document.createElement('li');
        li.className = 'track-item';
        if (track === currentTrack) {
            li.className += ' current';
        }
        li.textContent = track;
        li.addEventListener('click', () => playTrack(track));
        tracksList.appendChild(li);
    });
}

// Toggle between playing all tracks and favorites
async function togglePlayFavorites() {
    try {
        const switchToFavorites = !playingFavorites;

        // Load appropriate track list
        await loadTracks(switchToFavorites);

        // If currently playing, switch to first track of new list
        if (isPlaying) {
            await playTrack(tracks[0]);
        }

        status.textContent = switchToFavorites ? 'Playing favorites only' : 'Playing all tracks';
    } catch (error) {
        status.textContent = error.message;
        if (error.message === 'No favorites to play') {
            playingFavorites = false;
            updatePlayFavoritesIcon();
            await loadTracks(false); // Switch back to all tracks
        }
    }
}

// Play/Pause toggle
async function togglePlay() {
    try {
        if (isPlaying) {
            // Pause current track
            player.pause();
            isPlaying = false;
            updatePlayIcon();
            status.textContent = '⏸️ ' + currentTrack;
        } else {
            // If a track is loaded, resume it
            if (currentTrack) {
                await player.play();
                isPlaying = true;
                updatePlayIcon();
                status.textContent = currentTrack;
            } else {
                // Otherwise, start a new track
                if (shuffleMode) {
                    await playNext(); // playNext will fetch a random track
                } else {
                    // Get first track from server without loading entire list
                    const response = await fetch('/api/first');
                    const data = await response.json();
                    if (data.error) throw new Error(data.error);
                    await playTrack(data.track);
                }
            }
        }
    } catch (error) {
        status.textContent = 'Error: ' + error.message;
    }
}

// Play next track with improved error handling
async function playNext() {
    try {
        let nextTrack;

        if (shuffleMode) {
            // Fetch a random track from the server
            const response = await fetch('/api/shuffle');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            nextTrack = data.track;
        } else {
            // Get next track from server without loading entire list
            if (!currentTrack) {
                // If no current track, get first track
                const response = await fetch('/api/first');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                nextTrack = data.track;
            } else {
                // Get next track in sequence
                const response = await fetch(`/api/next/${encodeURIComponent(currentTrack)}`);
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                nextTrack = data.track;
            }
        }

        if (!nextTrack) {
            status.textContent = 'No next track found.';
            return;
        }

        console.log(`Playing next track: ${nextTrack}`);
        await playTrack(nextTrack);
        updateFavoriteIcon();

    } catch (error) {
        console.error('Error in playNext:', error);
        status.textContent = `Error playing next track: ${error.message}`;
        isPlaying = false;
        updatePlayIcon();
    }
}

// Play previous track with improved error handling
async function playPrev() {
    try {
        let prevTrack;

        if (shuffleMode) {
            // In shuffle mode, "previous" is just another random track
            const response = await fetch('/api/shuffle');
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            prevTrack = data.track;
        } else {
            // Get previous track from server without loading entire list
            if (!currentTrack) {
                // If no current track, get first track
                const response = await fetch('/api/first');
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                prevTrack = data.track;
            } else {
                // Get previous track in sequence
                const response = await fetch(`/api/prev/${encodeURIComponent(currentTrack)}`);
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                prevTrack = data.track;
            }
        }

        if (!prevTrack) {
            status.textContent = 'No previous track found.';
            return;
        }

        console.log(`Playing previous track: ${prevTrack}`);
        await playTrack(prevTrack);
        updateFavoriteIcon();

    } catch (error) {
        console.error('Error in playPrev:', error);
        status.textContent = `Error playing previous track: ${error.message}`;
        isPlaying = false;
        updatePlayIcon();
    }
}

// Toggle shuffle mode
function toggleShuffle() {
    shuffleMode = !shuffleMode;
    updateShuffleIcon();
    status.textContent = shuffleMode ? 'Shuffle mode enabled' : 'Shuffle mode disabled';
    console.log(`Shuffle mode ${shuffleMode ? 'enabled' : 'disabled'}`);
}

// Stop playback
function stopPlayback() {
    player.pause();
    player.currentTime = 0;
    isPlaying = false;
    updatePlayIcon();
    status.textContent = 'Stopped';

    // Stop buffer monitoring
    stopBufferMonitoring();

    // Release wake lock when stopping
    releaseWakeLock();
}

// Update progress bar
function updateProgress() {
    if (player.duration) {
        const progress = (player.currentTime / player.duration) * 100;
        progressBar.style.width = progress + '%';
    }
}

// Seek in track
function seek(event) {
    const rect = progress.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    player.currentTime = pos * player.duration;
}

// Update favorite button icon
function updateFavoriteIcon() {
    const icon = favoriteButton.querySelector('i');
    icon.className = favorites.has(currentTrack) ? 'fas fa-heart' : 'far fa-heart';
}

// Toggle favorite status of current track
function toggleFavorite() {
    if (!currentTrack) return;

    if (favorites.has(currentTrack)) {
        favorites.delete(currentTrack);
        if (playingFavorites && favorites.size === 0) {
            // Switch back to all tracks if we're playing favorites and removed the last one
            togglePlayFavorites();
        }
    } else {
        favorites.add(currentTrack);
    }

    localStorage.setItem('favorites', JSON.stringify([...favorites]));
    updateFavoriteIcon();
}

// Show favorites modal
function showFavorites() {
    favoritesList.innerHTML = '';

    if (favorites.size === 0) {
        const li = document.createElement('li');
        li.textContent = 'No favorites yet';
        favoritesList.appendChild(li);
    } else {
        [...favorites].forEach(track => {
            const li = document.createElement('li');

            const nameSpan = document.createElement('span');
            nameSpan.textContent = track;
            li.appendChild(nameSpan);

            const removeButton = document.createElement('button');
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.onclick = () => {
                favorites.delete(track);
                localStorage.setItem('favorites', JSON.stringify([...favorites]));
                li.remove();
                updateFavoriteIcon();
                if (favorites.size === 0) {
                    showFavorites(); // Refresh to show 'No favorites' message
                }
            };
            li.appendChild(removeButton);

            li.ondblclick = () => {
                favoritesModal.style.display = 'none';
                if (tracks.includes(track)) {
                    playTrack(track);
                }
            };

            favoritesList.appendChild(li);
        });
    }

    favoritesModal.style.display = 'block';
}

// Play only favorites
async function playFavorites() {
    if (favorites.size === 0) {
        status.textContent = 'No favorites to play';
        return;
    }

    tracks = [...favorites];
    if (isPlaying) {
        await playTrack(tracks[0]);
    }
}

// Volume control
let previousVolume = 1;

function updateVolumeIcon() {
    const icon = volumeButton.querySelector('i');
    if (player.volume === 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (player.volume < 0.5) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
}

function toggleMute() {
    if (player.volume > 0) {
        previousVolume = player.volume;
        player.volume = 0;
        volumeSlider.value = 0;
    } else {
        player.volume = previousVolume;
        volumeSlider.value = previousVolume * 100;
    }
    updateVolumeIcon();
}

function handleVolumeChange() {
    const volume = volumeSlider.value / 100;
    player.volume = volume;
    previousVolume = volume;
    updateVolumeIcon();
}

// Load saved volume or set to 50%
const savedVolume = localStorage.getItem('volume');
if (savedVolume !== null) {
    player.volume = savedVolume;
    volumeSlider.value = savedVolume * 100;
} else {
    player.volume = 0.5;
    volumeSlider.value = 50;
    localStorage.setItem('volume', 0.5);
}
updateVolumeIcon();

// Show version info
async function showVersionInfo() {
    try {
        const response = await fetch('/api/version');
        const data = await response.json();

        if (data.version) {
            status.textContent = `${data.name} v${data.version} - ${data.description}`;
            setTimeout(() => {
                if (status.textContent.includes(data.version)) {
                    status.textContent = currentTrack || 'Click play to start';
                }
            }, 3000);
        }
    } catch (error) {
        console.log('Could not load version info:', error);
        status.textContent = 'Popz Place Radio v1.1.0 - Mobile & Shuffle Fixes';
        setTimeout(() => {
            if (status.textContent.includes('v1.1.0')) {
                status.textContent = currentTrack || 'Click play to start';
            }
        }, 3000);
    }
}

// Toggle extended controls
function toggleExtendedControls() {
    const isVisible = controlsExtended.classList.contains('show');

    if (isVisible) {
        controlsExtended.classList.remove('show');
        moreControlsBtn.innerHTML = '<i class="fas fa-chevron-down"></i> More Controls';
    } else {
        controlsExtended.classList.add('show');
        moreControlsBtn.innerHTML = '<i class="fas fa-chevron-up"></i> Less Controls';
    }
}

// Event listeners
playButton.addEventListener('click', togglePlay);
prevButton.addEventListener('click', playPrev);
nextButton.addEventListener('click', playNext);
shuffleButton.addEventListener('click', toggleShuffle);
stopButton.addEventListener('click', stopPlayback);
favoriteButton.addEventListener('click', toggleFavorite);
favoritesListButton.addEventListener('click', showFavorites);
closeFavoritesButton.addEventListener('click', () => favoritesModal.style.display = 'none');
playFavoritesButton.addEventListener('click', togglePlayFavorites);
progressBar.addEventListener('click', seek);
player.addEventListener('timeupdate', updateProgress);
player.addEventListener('ended', playNext);
volumeButton.addEventListener('click', toggleMute);
volumeSlider.addEventListener('input', handleVolumeChange);
showTracksButton.addEventListener('click', showAllTracks);
closeTracksButton.addEventListener('click', () => tracksModal.style.display = 'none');
versionButton.addEventListener('click', showVersionInfo);
moreControlsBtn.addEventListener('click', toggleExtendedControls);

// Save volume setting
volumeSlider.addEventListener('change', () => {
    localStorage.setItem('volume', player.volume);
});

// Close modals if clicking outside
window.addEventListener('click', (e) => {
    if (e.target === favoritesModal) {
        favoritesModal.style.display = 'none';
    } else if (e.target === tracksModal) {
        tracksModal.style.display = 'none';
    }
});

// Enhanced audio event handlers for better buffering
player.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    status.textContent = 'Error playing audio';
    isPlaying = false;
    updatePlayIcon();
    stopBufferMonitoring();
    releaseWakeLock();
});

player.addEventListener('pause', () => {
    console.log('Audio paused');
    stopBufferMonitoring();
});

player.addEventListener('play', () => {
    console.log('Audio playing');
    startBufferMonitoring();
    requestWakeLock();
});

// Handle audio interruptions and buffering events
player.addEventListener('stalled', () => {
    console.log('Audio stalled during playback');
    if (isPlaying && !isBuffering) {
        isBuffering = true;
        status.textContent = `${currentTrack} - Connection stalled...`;
    }
});

player.addEventListener('waiting', () => {
    console.log('Audio waiting for data');
    if (isPlaying && !isBuffering) {
        isBuffering = true;
        status.textContent = `${currentTrack} - Buffering...`;
    }
});

player.addEventListener('canplaythrough', () => {
    console.log('Audio can play through - buffering complete');
    if (isBuffering) {
        isBuffering = false;
        status.textContent = currentTrack;
    }
});

player.addEventListener('loadstart', () => {
    console.log('Audio load started');
});

player.addEventListener('progress', () => {
    // Show buffering progress for large files
    if (player.buffered.length > 0 && player.duration) {
        const buffered = (player.buffered.end(0) / player.duration) * 100;
        if (buffered < 100 && isPlaying) {
            console.log(`Buffered: ${buffered.toFixed(1)}%`);
        }
    }
});

// Mobile-specific event handlers
document.addEventListener('visibilitychange', handleVisibilityChange);

// Handle page focus/blur for mobile
window.addEventListener('focus', () => {
    console.log('Window focused');
    if (isPlaying && player.paused) {
        player.play().catch(err => {
            console.log('Error resuming on focus:', err);
        });
    }
});

window.addEventListener('blur', () => {
    console.log('Window blurred - maintaining playback');
    // Don't pause on blur - let it continue playing
});

// Handle orientation changes (no forced orientation)
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        console.log('Orientation changed - layout will adapt automatically');
        // Just log the change, no forced orientation
    }, 100);
});
