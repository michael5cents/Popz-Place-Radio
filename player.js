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

// Track list and current track
let tracks = [];
let currentTrack = null;
let isPlaying = false;
let favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'));
let playingFavorites = false;
let shuffleMode = false;

// Mobile and wake lock support
let wakeLock = null;
let shuffleHistory = [];
let maxRetries = 3;
let currentRetries = 0;

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

// Shuffle array
function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Get next shuffle track with history to avoid repeats
function getNextShuffleTrack() {
    if (tracks.length === 0) return null;

    // If we've played all tracks, reset history
    if (shuffleHistory.length >= tracks.length) {
        shuffleHistory = [];
    }

    // Get tracks not in recent history
    let availableTracks = tracks.filter(track =>
        !shuffleHistory.includes(track) && track !== currentTrack
    );

    // If no available tracks (shouldn't happen), use all tracks except current
    if (availableTracks.length === 0) {
        availableTracks = tracks.filter(track => track !== currentTrack);
        shuffleHistory = []; // Reset history
    }

    // If still no tracks, just use the first track
    if (availableTracks.length === 0) {
        return tracks[0];
    }

    // Pick random track from available
    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    const selectedTrack = availableTracks[randomIndex];

    // Add to history
    shuffleHistory.push(selectedTrack);

    // Keep history manageable (max 50% of tracks)
    const maxHistory = Math.max(1, Math.floor(tracks.length / 2));
    if (shuffleHistory.length > maxHistory) {
        shuffleHistory = shuffleHistory.slice(-maxHistory);
    }

    return selectedTrack;
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

        // Set up the audio source
        player.src = data.url;

        // Wait for the audio to be ready
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
        if (!currentTrack) {
            // Start playing if nothing is playing
            await loadTracks(playingFavorites);
            await playTrack(tracks[0]);
        } else if (isPlaying) {
            // Pause current track
            player.pause();
            isPlaying = false;
            updatePlayIcon();
            status.textContent = '⏸️ ' + currentTrack;
        } else {
            // Resume current track
            await player.play();
            isPlaying = true;
            updatePlayIcon();
            status.textContent = currentTrack;
        }
    } catch (error) {
        status.textContent = 'Error: ' + error.message;
    }
}

// Play next track with improved error handling
async function playNext() {
    if (!tracks.length) {
        console.log('No tracks available for playNext');
        status.textContent = 'No tracks available';
        return;
    }

    try {
        let nextTrack;

        if (shuffleMode) {
            nextTrack = getNextShuffleTrack();
            if (!nextTrack) {
                console.log('No shuffle track available, using first track');
                nextTrack = tracks[0];
            }
        } else {
            const currentIndex = tracks.indexOf(currentTrack);
            const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tracks.length;
            nextTrack = tracks[nextIndex];
        }

        console.log(`Playing next track: ${nextTrack}`);
        await playTrack(nextTrack);
        updateFavoriteIcon();

    } catch (error) {
        console.error('Error in playNext:', error);
        status.textContent = `Error playing next track: ${error.message}`;

        // If we're in shuffle mode and there was an error, try another track
        if (shuffleMode && tracks.length > 1) {
            console.log('Shuffle mode: trying alternative track after error');
            setTimeout(() => {
                const alternativeTrack = getNextShuffleTrack();
                if (alternativeTrack && alternativeTrack !== currentTrack) {
                    playTrack(alternativeTrack).catch(err => {
                        console.error('Alternative track also failed:', err);
                        isPlaying = false;
                        updatePlayIcon();
                    });
                }
            }, 2000);
        } else {
            isPlaying = false;
            updatePlayIcon();
        }
    }
}

// Play previous track with improved error handling
async function playPrev() {
    if (!tracks.length) {
        console.log('No tracks available for playPrev');
        status.textContent = 'No tracks available';
        return;
    }

    try {
        let prevTrack;

        if (shuffleMode) {
            prevTrack = getNextShuffleTrack(); // In shuffle, prev is just another random track
            if (!prevTrack) {
                console.log('No shuffle track available, using last track');
                prevTrack = tracks[tracks.length - 1];
            }
        } else {
            const currentIndex = tracks.indexOf(currentTrack);
            const prevIndex = currentIndex === -1 ? tracks.length - 1 : (currentIndex - 1 + tracks.length) % tracks.length;
            prevTrack = tracks[prevIndex];
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

// Shuffle playlist with improved logic
async function shufflePlaylist() {
    if (!tracks.length) {
        status.textContent = 'No tracks to shuffle';
        return;
    }

    shuffleMode = !shuffleMode;
    updateShuffleIcon();

    if (shuffleMode) {
        // Reset shuffle history when enabling shuffle
        shuffleHistory = [];
        status.textContent = 'Shuffle mode enabled';

        // If currently playing, add current track to history
        if (currentTrack) {
            shuffleHistory.push(currentTrack);
        }

        console.log('Shuffle mode enabled');
    } else {
        // Restore original order by reloading tracks
        shuffleHistory = [];
        await loadTracks(playingFavorites);
        status.textContent = 'Shuffle mode disabled';
        console.log('Shuffle mode disabled');
    }
}

// Stop playback
function stopPlayback() {
    player.pause();
    player.currentTime = 0;
    isPlaying = false;
    updatePlayIcon();
    status.textContent = 'Stopped';

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

// Event listeners
playButton.addEventListener('click', togglePlay);
prevButton.addEventListener('click', playPrev);
nextButton.addEventListener('click', playNext);
shuffleButton.addEventListener('click', shufflePlaylist);
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

// Enhanced audio event handlers
player.addEventListener('ended', () => {
    console.log('Track ended, playing next');
    playNext();
});

player.addEventListener('timeupdate', updateProgress);

player.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    status.textContent = 'Error playing audio';
    isPlaying = false;
    updatePlayIcon();
    releaseWakeLock();
});

player.addEventListener('pause', () => {
    console.log('Audio paused');
    if (isPlaying) {
        // Only update if we think we should be playing (not user-initiated pause)
        isPlaying = false;
        updatePlayIcon();
    }
});

player.addEventListener('play', () => {
    console.log('Audio playing');
    isPlaying = true;
    updatePlayIcon();
    requestWakeLock();
});

// Handle audio interruptions (calls, notifications, etc.)
player.addEventListener('stalled', () => {
    console.log('Audio stalled');
    status.textContent = 'Audio stalled - buffering...';
});

player.addEventListener('waiting', () => {
    console.log('Audio waiting');
    status.textContent = 'Buffering...';
});

player.addEventListener('canplaythrough', () => {
    console.log('Audio can play through');
    if (currentTrack && status.textContent.includes('Buffering')) {
        status.textContent = currentTrack;
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
    console.log('Window blurred');
    // Don't pause on blur - let it continue playing
});

