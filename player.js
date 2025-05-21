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

// Update play button icon
function updatePlayIcon() {
    const icon = playButton.querySelector('i');
    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

// Load and play a track
async function playTrack(filename) {
    try {
        const response = await fetch(`/api/getsasurl/${encodeURIComponent(filename)}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        player.src = data.url;
        await player.play();
        currentTrack = filename;
        isPlaying = true;
        updatePlayIcon();
        updateFavoriteIcon();
        status.textContent = filename;
    } catch (error) {
        throw new Error('Failed to play: ' + error.message);
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

// Play next track
async function playNext() {
    if (!tracks.length) return;
    
    if (shuffleMode) {
        // Play a random track that's not the current one
        let availableTracks = tracks.filter(track => track !== currentTrack);
        if (availableTracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableTracks.length);
            await playTrack(availableTracks[randomIndex]);
        } else {
            await playTrack(tracks[0]);
        }
    } else {
        const currentIndex = tracks.indexOf(currentTrack);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tracks.length;
        await playTrack(tracks[nextIndex]);
    }
    
    updateFavoriteIcon();
}

// Play previous track
async function playPrev() {
    if (!tracks.length) return;
    
    if (shuffleMode) {
        // Play a random track that's not the current one
        let availableTracks = tracks.filter(track => track !== currentTrack);
        if (availableTracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableTracks.length);
            await playTrack(availableTracks[randomIndex]);
        } else {
            await playTrack(tracks[0]);
        }
    } else {
        const currentIndex = tracks.indexOf(currentTrack);
        const prevIndex = currentIndex === -1 ? tracks.length - 1 : (currentIndex - 1 + tracks.length) % tracks.length;
        await playTrack(tracks[prevIndex]);
    }
    
    updateFavoriteIcon();
}

// Shuffle playlist
async function shufflePlaylist() {
    if (!tracks.length) {
        status.textContent = 'No tracks to shuffle';
        return;
    }

    shuffleMode = !shuffleMode;
    updateShuffleIcon();

    if (shuffleMode) {
        tracks = shuffle(tracks);
        if (currentTrack) {
            const currentIndex = tracks.indexOf(currentTrack);
            if (currentIndex !== -1) {
                const nextTrack = tracks[(currentIndex + 1) % tracks.length];
                await playTrack(nextTrack);
            }
        } else {
            // If no track is playing, start with the first track
            await playTrack(tracks[0]);
        }
    } else {
        // Restore original order by reloading tracks
        await loadTracks(playingFavorites);
    }
}

// Stop playback
function stopPlayback() {
    player.pause();
    player.currentTime = 0;
    isPlaying = false;
    updatePlayIcon();
    status.textContent = 'Stopped';
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

// Audio events
player.addEventListener('ended', playNext);
player.addEventListener('timeupdate', updateProgress);
player.addEventListener('error', () => {
    status.textContent = 'Error playing audio';
    isPlaying = false;
    updatePlayIcon();
});

// No longer need this since we update when track changes
// player.addEventListener('play', updateFavoriteIcon);

