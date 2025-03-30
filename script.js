document.getElementById('submitButton').addEventListener('click', convertUrlToUri);

function convertUrlToUri() {
    var url = document.getElementById("spotifyLink").value;
    var parts = url.split('/');
    if (parts.length < 5 || parts[2] !== "open.spotify.com") {
        document.getElementById("outputUri").innerHTML = 'Invalid Spotify URL.';
        return;
    } else {
        document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER VEDERE IL CONTENUTO RAW IN ASCII";
    }

    var type = parts[3];
    var id = parts[4].split('?')[0]; // Remove any query parameters
    var uri = 'spotify:' + type + ':' + id;
    displaySpotifyCode(uri);
    console.log("Spotify URI generato: " + uri);
}

function displaySpotifyCode(uri) {
    var spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
    var img = document.createElement('img');
    img.src = spotifyCodeUrl;
    img.alt = 'Spotify Code';
    img.style.width = '320px';
    img.style.height = 'auto';
    img.style.cursor = 'pointer';

    img.addEventListener('click', function() {
        fetch(spotifyCodeUrl)
            .then(response => response.blob())
            .then(blob => {
                var reader = new FileReader();
                reader.onload = function() {
                    var asciiContent = reader.result.split('').map(function (char) {
                        return char.charCodeAt(0) > 127 ? '?' : char;
                    }).join('');
                    var outputDiv = document.getElementById("outputUri");
                    outputDiv.innerHTML = `<pre>${asciiContent}</pre>`;
                }
                reader.readAsText(blob);
            });
    });

    var previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = ''; // Clear previous content
    previewDiv.appendChild(img);
}
