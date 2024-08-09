document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
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
    bass.frequency.setValueAtTime(100, context.currentTime); // Set bass frequency
    bass.gain.setValueAtTime(0, context.currentTime);

    mid.type = 'peaking';
    mid.frequency.setValueAtTime(1000, context.currentTime); // Set mid frequency
    mid.gain.setValueAtTime(0, context.currentTime);

    treble.type = 'highshelf';
    treble.frequency.setValueAtTime(3000, context.currentTime); // Set treble frequency
    treble.gain.setValueAtTime(0, context.currentTime);

    // Connect the audio graph
    source.connect(bass);
    bass.connect(mid);
    mid.connect(treble);
    treble.connect(gainNode);
    gainNode.connect(context.destination);

    let playlistSongs = [];
    let currentSongIndex = 0;

    // Event listener for file upload
    uploadButton.addEventListener('click', () => {
        if (fileInput.files.length) {
            const files = Array.from(fileInput.files);
            playlistSongs = files.map(file => URL.createObjectURL(file));
            updatePlaylist();
            if (!audio.src) {
                playNext();
            }
        }
    });

    // Update the playlist display
    function updatePlaylist() {
        playlist.innerHTML = playlistSongs.map((song, index) => 
            `<div class="playlist-item" data-index="${index}">
                ${playlistSongs[index].split('/').pop()}
            </div>`
        ).join('');
    }

    // Play the next song in the playlist
    function playNext() {
        if (playlistSongs.length > 0) {
            audio.src = playlistSongs[currentSongIndex];
            audio.play();
            updatePlaylistUI();
        }
    }

    // Event listener for play button
    document.getElementById('play').addEventListener('click', () => {
        audio.play();
    });

    // Event listener for pause button
    document.getElementById('pause').addEventListener('click', () => {
        audio.pause();
    });

    // Event listener for previous button
    document.getElementById('previous').addEventListener('click', () => {
        if (playlistSongs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + playlistSongs.length) % playlistSongs.length;
            playNext();
        }
    });

    // Event listener for next button
    document.getElementById('next').addEventListener('click', () => {
        if (playlistSongs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % playlistSongs.length;
            playNext();
        }
    });

    // Event listener for restart button
    document.getElementById('restart').addEventListener('click', () => {
        audio.currentTime = 0;
    });

    // Event listener for progress bar
    document.getElementById('progress').addEventListener('input', (event) => {
        audio.currentTime = (event.target.value / 100) * audio.duration;
    });

    audio.addEventListener('timeupdate', () => {
        document.getElementById('progress').value = (audio.currentTime / audio.duration) * 100;
        document.getElementById('current-time').textContent = formatTime(audio.currentTime);
        document.getElementById('duration').textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (document.getElementById('play-next').checked) {
            currentSongIndex = (currentSongIndex + 1) % playlistSongs.length;
            playNext();
        }
    });

    // Event listeners for effect controls
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

    // Helper function to format time
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Update the playlist UI
    function updatePlaylistUI() {
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.style.backgroundColor = item.dataset.index == currentSongIndex ? '#ffb6c1' : '#fff';
        });
    }

    // Initial setup
    updatePlaylist();
});