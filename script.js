document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const playlist = document.getElementById('playlist');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeSlider = document.getElementById('volume');
    const bassSlider = document.getElementById('bass');
    const midSlider = document.getElementById('mids');
    const trebSlider = document.getElementById('treble');
    
    let audioFiles = [];
    let currentTrackIndex = 0;
    let audioContext, source, gainNode, bassFilter, midFilter, trebleFilter;

    function setupAudioContext() {
        audioContext = new AudioContext();
        gainNode = audioContext.createGain();
        bassFilter = audioContext.createBiquadFilter();
        midFilter = audioContext.createBiquadFilter();
        trebleFilter = audioContext.createBiquadFilter();

        bassFilter.type = 'lowshelf';
        bassFilter.frequency.setValueAtTime(100, audioContext.currentTime);

        midFilter.type = 'peaking';
        midFilter.frequency.setValueAtTime(1000, audioContext.currentTime);

        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.setValueAtTime(3000, audioContext.currentTime);

        gainNode.connect(bassFilter);
        bassFilter.connect(midFilter);
        midFilter.connect(trebleFilter);
        trebleFilter.connect(audioContext.destination);
    }

    function playCurrentTrack() {
        if (audioFiles.length > 0) {
            const selectedOption = playlist.options[currentTrackIndex];
            const audioUrl = selectedOption.value;

            if (source) {
                source.disconnect();
            }

            fetch(audioUrl)
                .then(response => response.arrayBuffer())
                .then(data => audioContext.decodeAudioData(data))
                .then(buffer => {
                    source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(gainNode);
                    source.start();
                });
        }
    }

    function updatePlaylist() {
        playlist.innerHTML = '';
        audioFiles.forEach((file, index) => {
            const option = document.createElement('option');
            option.value = URL.createObjectURL(file);
            option.textContent = file.name;
            playlist.appendChild(option);
        });
        if (audioFiles.length > 0) {
            playlist.selectedIndex = 0;
            playCurrentTrack();
        }
    }

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        audioFiles = Array.from(event.target.files);
        updatePlaylist();
    });

    playlist.addEventListener('change', (event) => {
        currentTrackIndex = playlist.selectedIndex;
        playCurrentTrack();
    });

    playBtn.addEventListener('click', () => {
        if (!audioContext) {
            setupAudioContext();
        }
        playCurrentTrack();
    });

    pauseBtn.addEventListener('click', () => {
        if (source) {
            source.stop();
        }
    });

    stopBtn.addEventListener('click', () => {
        if (source) {
            source.stop();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (audioFiles.length > 0) {
            currentTrackIndex = (currentTrackIndex - 1 + audioFiles.length) % audioFiles.length;
            playlist.selectedIndex = currentTrackIndex;
            playCurrentTrack();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (audioFiles.length > 0) {
            currentTrackIndex = (currentTrackIndex + 1) % audioFiles.length;
            playlist.selectedIndex = currentTrackIndex;
            playCurrentTrack();
        }
    });

    volumeSlider.addEventListener('input', (event) => {
        if (gainNode) {
            gainNode.gain.value = event.target.value;
        }
    });

    bassSlider.addEventListener('input', (event) => {
        if (bassFilter) {
            bassFilter.gain.value = event.target.value;
        }
    });

    midSlider.addEventListener('input', (event) => {
        if (midFilter) {
            midFilter.gain.value = event.target.value;
        }
    });

    trebSlider.addEventListener('input', (event) => {
        if (trebleFilter) {
            trebleFilter.gain.value = event.target.value;
        }
    });
});