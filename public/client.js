async function convertUrlToUri() {
  console.log("Funzione convertUrlToUri chiamata");
  var url = document.getElementById("spotifyLink").value;
  console.log("URL inserito:", url);
  var parts = url.split('/');
  if (parts.length < 5 || parts[2] !== "open.spotify.com") {
    console.log("URL non valido");
    document.getElementById("outputUri").innerHTML = 'Invalid Spotify URL.';
    return;
  } else {
    document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
  }
  if (parts[3] == "intl-it") {
    var type = parts[4];
    var id = parts[5].split('?')[0];
  } else {
    var type = parts[3];
    var id = parts[4].split('?')[0];
  }
  var uri = 'spotify:' + type + ':' + id;
  console.log("Spotify URI generato:", uri);
  displaySpotifyCode(uri);
}

function displaySpotifyCode(uri) {
  console.log("Funzione displaySpotifyCode chiamata con URI:", uri);
  var spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
  var img = document.createElement('img');
  img.src = spotifyCodeUrl;
  img.alt = 'Spotify Code';
  img.style.width = '320px';
  img.style.height = 'auto';
  img.style.cursor = 'pointer';
  img.addEventListener('click', function() {
    console.log("Immagine cliccata per convertire in SVG");
    callServerToConvertImage(spotifyCodeUrl, 'spotify_code.svg');
  });
  var outputDiv = document.getElementById("outputUri");
  outputDiv.innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
  
  var previewDiv = document.getElementById("preview");
  previewDiv.innerHTML = '';
  previewDiv.appendChild(img);
}

async function callServerToConvertImage(url, filename) {
  console.log("Chiamata al server per convertire l'immagine con URL:", url);
  try {
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, filename })
    });
    if (response.ok) {
      console.log("Conversione completata con successo");
    } else {
      console.error("Errore durante la conversione");
    }
  } catch (err) {
    console.error("Errore durante la chiamata al server:", err);
  }
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
