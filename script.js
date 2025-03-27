function cambiaTesto() {
    document.getElementById("demo").innerHTML = "Hai cliccato il bottone!";
}

function convertUrlToUri() {
    var url = document.getElementById("urlInput").value;
    var parts = url.split('/');
    if (parts.length < 5 || parts[2] !== "open.spotify.com") {
        document.getElementById("outputUri").innerHTML = 'Invalid Spotify URL.';
        return;
    }
    var type = parts[3];
    var id = parts[4].split('?')[0]; // Remove any query parameters
    var uri = 'spotify:' + type + ':' + id;
    downloadSpotifyCode(uri);
}

function downloadSpotifyCode(uri) {
    var spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
    var link = document.createElement('a');
    link.href = spotifyCodeUrl;
    link.download = 'spotify_code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
