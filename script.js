document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const clearButton = document.getElementById('clear-playlist');
    const saveButton = document.getElementById('save-playlist');
    const restoreButton = document.getElementById('restore-playlist');
    const playlist = document.getElementById('playlist');
    const audio = new Audio();
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const source = context.createMediaElementSource(audio);
    const gainNode = context.createGain();
    const bass = context.createBiquadFilter();
    const mid = context.createBiquadFilter();
    const treble = context.createBiquadFilter();
    const lowMid = context.createBiquadFilter(); // New filter for low mid

    // Initialize filter nodes
    bass.type = 'lowshelf';
    bass.frequency.setValueAtTime(100, context.currentTime);
    bass.gain.setValueAtTime(0, context.currentTime);

    mid.type = 'peaking';
    mid.frequency.setValueAtTime(1000, context.currentTime);
    mid.gain.setValueAtTime(0, context.currentTime);

    treble.type = 'highshelf';
    treble.frequency.setValueAtTime(3000, context.currentTime);
    treble.gain.setValueAtTime(0, context.currentTime);

    lowMid.type = 'peaking'; // Set type to peaking filter
    lowMid.frequency.setValueAtTime(500, context.currentTime); // Frequency for low mid
    lowMid.gain.setValueAtTime(0, context.currentTime); // Initial gain

    // Connect the audio graph
    source.connect(bass);
    bass.connect(lowMid); // Connect bass to low mid
    lowMid.connect(mid); // Connect low mid to mid
    mid.connect(treble);
    treble.connect(gainNode);
    gainNode.connect(context.destination);

    let playlistSongs = [];
    let songNames = [];
    let currentSongIndex = 0;
    let isRandomPlaying = false;
    let playNext = false;

    function playNextSong() {
        if (playlistSongs.length > 0) {
            if (isRandomPlaying) {
                currentSongIndex = Math.floor(Math.random() * playlistSongs.length);
            } else {
                currentSongIndex = (currentSongIndex + 1) % playlistSongs.length;
            }
            audio.src = playlistSongs[currentSongIndex];
            audio.play().catch(error => {
                console.error('Audio playback error:', error);
            });
            updatePlaylistUI();
            scrollToCurrentSong(); // Scroll to the currently playing song
        }
    }

    function playPreviousSong() {
        if (playlistSongs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + playlistSongs.length) % playlistSongs.length;
            audio.src = playlistSongs[currentSongIndex];
            audio.play().catch(error => {
                console.error('Audio playback error:', error);
            });
            updatePlaylistUI();
            scrollToCurrentSong(); // Scroll to the currently playing song
        }
    }

    function updatePlaylist() {
        playlist.innerHTML = playlistSongs.length > 0
            ? playlistSongs.map((song, index) =>
                `<div class="playlist-item" data-index="${index}">
                    ${songNames[index]}
                </div>`
            ).join('')
            : 'No songs uploaded yet.';
        updatePlaylistUI();
    }

    function updatePlaylistUI() {
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.style.backgroundColor = item.dataset.index == currentSongIndex ? '#ffb6c1' : '#fff';
        });
    }

    function savePlaylist() {
        localStorage.setItem('savedPlaylist', JSON.stringify({
            playlistSongs: playlistSongs,
            songNames: songNames,
            currentSongIndex: currentSongIndex
        }));
    }

    function restorePlaylist() {
        const savedData = localStorage.getItem('savedPlaylist');
        if (savedData) {
            const data = JSON.parse(savedData);
            playlistSongs = data.playlistSongs;
            songNames = data.songNames;
            currentSongIndex = data.currentSongIndex;
            updatePlaylist();
            if (playlistSongs.length > 0) {
                if (audio.src === '') {
                    // Start playback immediately with the first song
                    audio.src = playlistSongs[currentSongIndex];
                    audio.play().catch(error => {
                        console.error('Audio playback error:', error);
                    });
                    updatePlaylistUI();
                    scrollToCurrentSong();
                }
            }
        }
    }

    function scrollToCurrentSong() {
        const currentItem = document.querySelector(`.playlist-item[data-index="${currentSongIndex}"]`);
        if (currentItem) {
            playlist.scrollTop = currentItem.offsetTop - playlist.offsetTop;
        }
    }

    function toggleCheckbox(checkedCheckbox) {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox !== checkedCheckbox) {
                checkbox.checked = false;
            }
        });
        if (checkedCheckbox.id === 'play-random') {
            isRandomPlaying = checkedCheckbox.checked;
        } else if (checkedCheckbox.id === 'play-next') {
            playNext = checkedCheckbox.checked;
        }
    }

    clearButton.addEventListener('click', () => {
        playlistSongs = [];
        songNames = [];
        updatePlaylist();
        audio.pause();
        audio.src = '';
    });

    saveButton.addEventListener('click', savePlaylist);
    restoreButton.addEventListener('click', restorePlaylist);

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            const files = Array.from(fileInput.files);
            files.forEach(file => {
                const fileURL = URL.createObjectURL(file);
                playlistSongs.push(fileURL);
                songNames.push(file.name);
            });
            // Sort songs by their numeric prefix
            sortPlaylist();
            updatePlaylist();
            if (playlistSongs.length > 0) {
                if (audio.src === '') {
                    // Start playback immediately with the first song
                    audio.src = playlistSongs[currentSongIndex];
                    audio.play().catch(error => {
                        console.error('Audio playback error:', error);
                    });
                    updatePlaylistUI();
                    scrollToCurrentSong();
                }
            }
        }
    });

    function sortPlaylist() {
        const items = playlistSongs.map((song, index) => ({ song, name: songNames[index] }));
        items.sort((a, b) => {
            const aIndex = extractIndex(a.name);
            const bIndex = extractIndex(b.name);
            return aIndex - bIndex;
        });
        playlistSongs = items.map(item => item.song);
        songNames = items.map(item => item.name);
    }

    function extractIndex(name) {
        const match = name.match(/^(\d+)\s/);
        return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER; // If no number prefix, place at the end
    }

    document.getElementById('play-pause').addEventListener('click', () => {
        if (audio.paused) {
            context.resume().then(() => {
                audio.play().catch(error => {
                    console.error('Audio playback error:', error);
                });
                document.getElementById('play-pause').textContent = '⏸️'; // Pause icon
            });
        } else {
            audio.pause();
            document.getElementById('play-pause').textContent = '▶️'; // Play icon
        }
    });

    document.getElementById('previous').addEventListener('click', playPreviousSong);

    document.getElementById('next').addEventListener('click', () => {
        if (playNext) {
            playNextSong();
        } else if (isRandomPlaying) {
            // If play-random is selected, play a random song on next
            playNextSong();
        } else {
            // Normal behavior: skip to the next song
            playNextSong();
        }
    });

    document.getElementById('restart').addEventListener('click', () => {
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.error('Audio playback error:', error);
        });
    });

    document.getElementById('volume').addEventListener('input', (e) => {
        gainNode.gain.setValueAtTime(e.target.value, context.currentTime);
    });

    document.getElementById('bass').addEventListener('input', (e) => {
        bass.gain.setValueAtTime(e.target.value, context.currentTime);
    });

    document.getElementById('mid').addEventListener('input', (e) => {
        mid.gain.setValueAtTime(e.target.value, context.currentTime);
    });

    document.getElementById('treble').addEventListener('input', (e) => {
        treble.gain.setValueAtTime(e.target.value, context.currentTime);
    });

    document.getElementById('low-mid').addEventListener('input', (e) => { // New slider
        lowMid.gain.setValueAtTime(e.target.value, context.currentTime);
    });

    document.getElementById('play-random').addEventListener('change', (e) => {
        toggleCheckbox(e.target);
    });

    document.getElementById('play-next').addEventListener('change', (e) => {
        toggleCheckbox(e.target);
    });

    // Update progress bar and time display
    audio.addEventListener('timeupdate', () => {
        const progress = document.getElementById('progress');
        const currentTime = document.getElementById('current-time');
        const duration = document.getElementById('duration');
        progress.value = (audio.currentTime / audio.duration) * 100;
        currentTime.textContent = formatTime(audio.currentTime);
        duration.textContent = formatTime(audio.duration);
    });

    document.getElementById('progress').addEventListener('input', (e) => {
        const progress = e.target.value;
        audio.currentTime = (progress / 100) * audio.duration;
    });

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Ensure the `next` button respects the play-random and play-next settings
    audio.addEventListener('ended', () => {
        if (playNext || isRandomPlaying) {
            playNextSong();
        }
    });
});