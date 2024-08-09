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
    
    // Connect the audio graph
    source.connect(bass);
    bass.connect(mid);
    mid.connect(treble);
    treble.connect(gainNode);
    gainNode.connect(context.destination);
    
    let playlistSongs = [];
    let songNames = [];
    let savedPlaylist = [];
    let isRandomPlaying = false;
    let playNext = false;
    let currentSongIndex = 0;

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
        }
    }
    
    function updatePlaylist() {
        playlist.innerHTML = playlistSongs.map((song, index) => 
            `<div class="playlist-item" data-index="${index}">
                ${songNames[index]}
            </div>`
        ).join('');
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
            playNextSong();
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
                // Add new files to existing playlist
                const fileURL = URL.createObjectURL(file);
                playlistSongs.push(fileURL);
                songNames.push(file.name);
            });
            updatePlaylist();
            if (playlistSongs.length > 0) {
                audio.src = playlistSongs[currentSongIndex];
                audio.play().catch(error => {
                    console.error('Audio playback error:', error);
                });
            }
        }
    });

    document.getElementById('play').addEventListener('click', () => {
        context.resume().then(() => {
            audio.play().catch(error => {
                console.error('Audio playback error:', error);
            });
        });
    });

    document.getElementById('pause').addEventListener('click', () => {
        audio.pause();
    });

    document.getElementById('previous').addEventListener('click', playPreviousSong);

    document.getElementById('next').addEventListener('click', playNextSong);

    document.getElementById('restart').addEventListener('click', () => {
        audio.currentTime = 0;
    });

    document.getElementById('progress').addEventListener('input', (event) => {
        audio.currentTime = (event.target.value / 100) * audio.duration;
    });

    audio.addEventListener('timeupdate', () => {
        document.getElementById('progress').value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current-time').textContent = formatTime(audio.currentTime);
        document.getElementById('duration').textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (isRandomPlaying) {
            playNextSong();  // Play a random song when the current one ends
        } else if (playNext) {
            playNextSong();  // Play the next song in the list
        }
    });

    document.getElementById('bass').addEventListener('input', (event) => {
        bass.gain.setValueAtTime(event.target.value, context.currentTime);
    });

    document.getElementById('mid').addEventListener('input', (event) => {
        mid.gain.setValueAtTime(event.target.value, context.currentTime);
    });

    document.getElementById('treble').addEventListener('input', (event) => {
        treble.gain.setValueAtTime(event.target.value, context.currentTime);
    });

    document.getElementById('volume').addEventListener('input', (event) => {
        gainNode.gain.setValueAtTime(event.target.value, context.currentTime);
    });

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    document.getElementById('play-random').addEventListener('change', (event) => {
        isRandomPlaying = event.target.checked;
        if (isRandomPlaying) {
            document.getElementById('play-next').checked = false;
            playNextSong(); // Start playing a random song immediately
        }
    });

    document.getElementById('play-next').addEventListener('change', (event) => {
        playNext = event.target.checked;
        if (playNext) {
            document.getElementById('play-random').checked = false;
            playNextSong(); // Start playing the next song immediately
        }
    });

    updatePlaylist();
});