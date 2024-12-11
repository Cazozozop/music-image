document.getElementById('image-upload').addEventListener('change', function(event) {
    const image = document.getElementById('image');
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image.src = e.target.result;
            image.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('audio-upload').addEventListener('change', function(event) {
    const audio = document.getElementById('audio');
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioSource = document.getElementById('audio-source');
            audioSource.src = e.target.result;
            audio.load();
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('play-btn').addEventListener('click', function() {
    const audio = document.getElementById('audio');
    const image = document.getElementById('image');
    if (audio.paused) {
        audio.play();
        animateImage(image, audio);
    } else {
        audio.pause();
        image.style.transform = 'none'; // Reset vibration when paused
    }
});

document.getElementById('export-btn').addEventListener('click', function() {
    const audio = document.getElementById('audio');
    const image = document.getElementById('image');

    if (audio.paused) {
        alert("La musique doit être en cours de lecture pour exporter la vidéo.");
        return;
    }

    // Capture l'écran pendant que l'image vibre
    captureAndExportVideo(image, audio);
});

function animateImage(image, audio) {
    const interval = setInterval(() => {
        if (!audio.paused) {
            image.style.transform = `translateX(${Math.random() * 10 - 5}px) translateY(${Math.random() * 10 - 5}px)`;
        } else {
            clearInterval(interval);
        }
    }, 100); // Vibration speed (adjust for desired effect)
}

async function captureAndExportVideo(image, audio) {
    const frames = [];
    const frameRate = 30; // Frames per second
    const duration = audio.duration; // Duration of the audio
    const totalFrames = Math.floor(duration * frameRate);

    for (let i = 0; i < totalFrames; i++) {
        const canvas = await html2canvas(image);
        frames.push(canvas.toDataURL());
    }

    // Initialisation de ffmpeg.js
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: true });

    await ffmpeg.load();

    // Convertir les images en vidéo
    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const fileName = `frame${i}.png`;
        await ffmpeg.FS('writeFile', fileName, fetchFile(frame));
    }

    await ffmpeg.run('-framerate', frameRate, '-i', 'frame%d.png', '-c:v', 'libx264', '-r', frameRate, '-pix_fmt', 'yuv420p', 'output.mp4');

    // Récupérer la vidéo générée
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const videoURL = URL.createObjectURL(videoBlob);

    // Télécharger la vidéo
    const link = document.createElement('a');
    link.href = videoURL;
    link.download = 'output.mp4';
    link.click();
}
