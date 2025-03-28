const potrace = require('potrace');
const fs = require('fs');
const fetch = require('node-fetch');

function cambiaTesto() {
    document.getElementById("demo").innerHTML = "Hai cliccato il bottone!";
}

function convertUrlToUri() {
    var url = document.getElementById("spotifyLink").value; // Cambia l'ID a "spotifyLink"
    var parts = url.split('/');
    var outputDiv = document.getElementById("outputUri");

    if (parts.length < 5 || parts[2] !== "open.spotify.com") {
        outputDiv.innerHTML = 'Invalid Spotify URL.';
        return;
    } else {
        outputDiv.innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
    }

    var type = parts[3];
    var id = parts[4].split('?')[0]; // Remove any query parameters
    var uri = 'spotify:' + type + ':' + id;
    displaySpotifyCode(uri);
    outputDiv.innerHTML = "Spotify URI generato: " + uri; // Log message
}

function displaySpotifyCode(uri) {
    var spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
    var img = document.createElement('img');
    img.src = spotifyCodeUrl;
    img.alt = 'Spotify Code';
    img.style.width = '320px'; // Modifica la larghezza a 320px
    img.style.height = 'auto';
    img.style.cursor = 'pointer'; // Change cursor to pointer to indicate clickability
    img.addEventListener('click', function() {
        convertImageToSVG(spotifyCodeUrl, 'spotify_code.svg');
    });

    var outputDiv = document.getElementById("outputUri");
    outputDiv.innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG"; // Clear previous content and add text
    outputDiv.innerHTML = "Spotify Code URL: " + spotifyCodeUrl; // Log message
    
    var previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = ''; // Clear previous content
    previewDiv.appendChild(img);
}

async function convertImageToSVG(url, filename) {
    var outputDiv = document.getElementById("outputUri");
    try {
        const response = await fetch(url);
        const buffer = await response.buffer();
        const tempFile = 'temp.png';
        fs.writeFileSync(tempFile, buffer);
        outputDiv.innerHTML = "Image fetched and saved as temp.png"; // Log message

        potrace.trace(tempFile, { turdSize: 100, alphaMax: 0.4 }, function (err, svg) {
            if (err) throw err;
            var blob = new Blob([svg], { type: 'image/svg+xml' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Rimuove il file temporaneo
            fs.unlinkSync(tempFile);
            outputDiv.innerHTML = "SVG file created and downloaded"; // Log message
        });
    } catch (err) {
        console.error(err);
        outputDiv.innerHTML = "Error: " + err.message; // Log message
    }
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
