function cambiaTesto() {
    document.getElementById("demo").innerHTML = "Hai cliccato il bottone!";
}

function convertUrlToUri() {
    var url = document.getElementById("spotifyLink").value; // Cambia l'ID a "spotifyLink"
    var parts = url.split('/');
    if (parts.length < 5 || parts[2] !== "open.spotify.com") {
        document.getElementById("outputUri").innerHTML = 'Invalid Spotify URL.';
        return;
    } else {
        document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
    }

    var type = parts[3];
    var id = parts[4].split('?')[0]; // Rimuovi eventuali parametri di query
    var uri = 'spotify:' + type + ':' + id;
    displaySpotifyCode(uri);
    console.log("Spotify URI generato: " + uri); // Aggiungi una stampa per la console
}

function displaySpotifyCode(uri) {
    var spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
    var img = document.createElement('img');
    img.src = spotifyCodeUrl;
    img.alt = 'Spotify Code';
    img.style.width = '320px'; // Modifica la larghezza a 320px
    img.style.height = 'auto';
    img.style.cursor = 'pointer'; // Cambia il cursore a puntatore per indicare la cliccabilità
    img.addEventListener('click', function() {
        convertImageToSVG(spotifyCodeUrl, 'spotify_code.svg');
    });

    var outputDiv = document.getElementById("outputUri");
    outputDiv.innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG"; // Pulisci il contenuto precedente e aggiungi il testo
    
    var previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = ''; // Pulisci il contenuto precedente
    previewDiv.appendChild(img);
}

async function convertImageToSVG(url, filename) {
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer], { type: 'image/png' });

        potrace.trace(blob, { turdSize: 100, alphaMax: 0.4 }, function (err, svg) {
            if (err) throw err;
            var svgBlob = new Blob([svg], { type: 'image/svg+xml' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(svgBlob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
