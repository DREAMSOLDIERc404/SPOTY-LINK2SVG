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
    var id = parts[4].split('?')[0]; // Remove any query parameters
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
    img.style.cursor = 'pointer'; // Change cursor to pointer to indicate clickability

    // Aggiungere un link di download
    img.addEventListener('click', function() {
        var link = document.createElement('a');
        link.href = spotifyCodeUrl;
        link.download = 'spotify_code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    var outputDiv = document.getElementById("outputUri");
    outputDiv.innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG"; // Clear previous content and add text
    
    var previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = ''; // Clear previous content
    previewDiv.appendChild(img);
}
