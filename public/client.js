function cambiaTesto() {
  console.log("Funzione cambiaTesto chiamata");
  document.getElementById("demo").innerHTML = "Hai cliccato il bottone!";
}

function convertUrlToUri() {
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
  var type = parts[3];
  var id = parts[4].split('?')[0];
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
    convertImageToSVG(spotifyCodeUrl, 'spotify_code.svg');
  });
  var outputDiv = document.getElementById("outputUri");
  outputDiv.innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
  
  var previewDiv = document.getElementById("preview");
  previewDiv.innerHTML = '';
  previewDiv.appendChild(img);
}

async function convertImageToSVG(url, filename) {
  console.log("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const tempFile = 'temp.png';
    fs.writeFileSync(tempFile, buffer);
    potrace.trace(tempFile, { turdSize: 100, alphaMax: 0.4 }, function (err, svg) {
      if (err) throw err;
      var blob = new Blob([svg], { type: 'image/svg+xml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      fs.unlinkSync(tempFile);
    });
  } catch (err) {
    console.error("Errore durante la conversione dell'immagine in SVG:", err);
  }
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
