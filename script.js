function cambiaTesto() {
    document.getElementById("demo").innerHTML = "Hai cliccato il bottone!";
}

function convertUrlToUri() {
    var url = document.getElementById("urlInput").value;
    console.log("URL inserito:", url);
    var parts = url.split('/');
    if (parts.length < 5 || parts[2] !== "open.spotify.com") {
        document.getElementById("outputUri").innerHTML = 'Invalid Spotify URL.';
        console.error("URL non valido");
        return;
    }
    var type = parts[3];
    var id = parts[4].split('?')[0]; // Remove any query parameters
    var uri = 'spotify:' + type + ':' + id;
    console.log("URI generato:", uri);
    downloadSpotifyCode(uri);
}

function downloadSpotifyCode(uri) {
    var spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
    console.log("URL dell'immagine:", spotifyCodeUrl);
    var link = document.createElement('a');
    link.href = spotifyCodeUrl;
    link.download = 'spotify_code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Download avviato");
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
