// client.js

async function convertUrlToUri() {
  console.log("Funzione convertUrlToUri chiamata");

  // Pulizia di eventuali preview o messaggi precedenti
  document.getElementById("preview").innerHTML = "";
  document.getElementById("outputUri").innerHTML = "";

  const url = document.getElementById("spotifyLink").value;
  console.log("URL inserito:", url);
  const parts = url.split('/');

  // Controllo basilare del formato dell'URL Spotify
  if (parts.length < 5 || parts[2] !== "open.spotify.com") {
    console.log("URL non valido");
    setErrorMessage("Invalid Spotify URL");
    return;
  }

  // Tentativo di estrazione dell'ID e del tipo (gestisce anche "intl-it")
  let type, id;
  if (parts[3] === "intl-it") {
    type = parts[4];
    id = parts[5].split('?')[0];
  } else {
    type = parts[3];
    id = parts[4].split('?')[0];
  }

  const uri = 'spotify:' + type + ':' + id;
  console.log("Spotify URI generato:", uri);

  // Recupera i dettagli della traccia tramite il nostro endpoint /api/track
  let trackName = 'spotify_code';
  try {
    const response = await fetch(`/api/track?trackId=${id}`);
    if (response.ok) {
      const track = await response.json();
      // Sanitizza il nome della traccia: sostituisce i caratteri non alfanumerici con "_"
      trackName = track.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    } else {
      console.error("Errore nel recupero della traccia:", response.status);
      setErrorMessage("Invalid Spotify URL");
      return;
    }
  } catch (err) {
    console.error("Errore nella chiamata a /api/track:", err);
    setErrorMessage("Invalid Spotify URL");
    return;
  }

  // Solo se tutto va bene si rigenera lo Spotify Code
  displaySpotifyCode(uri, `${trackName}.svg`);
}

function displaySpotifyCode(uri, downloadFilename) {
  console.log("Funzione displaySpotifyCode chiamata con URI:", uri);
  // Genera gli URL per lo Spotify Code in PNG (versione per la preview e per la conversione in SVG)
  const spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
  const spotifyCodeUrlSVG = `https://scannables.scdn.co/uri/plain/png/FFFFFF/black/1000/${encodeURIComponent(uri)}`;

  const img = document.createElement('img');
  img.src = spotifyCodeUrl;
  img.alt = 'Spotify Code';
  img.style.width = '320px';
  img.style.height = 'auto';
  img.style.cursor = 'pointer';

  // Se l'immagine non viene caricata, mostra il messaggio d'errore
  img.onerror = () => {
    console.error("Immagine non trovata.");
    setErrorMessage("Invalid Spotify URL");
  };

  // Quando l'immagine viene caricata con successo, mostra il messaggio e la preview
  img.onload = () => {
    // Mostra la scritta solo se l'immagine è stata caricata
    document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
    const previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = "";
    previewDiv.appendChild(img);
  };

  img.addEventListener('click', () => {
    console.log("Immagine cliccata per convertire in SVG");
    fetch(
      `/api/convert?url=${encodeURIComponent(spotifyCodeUrlSVG)}&filename=${encodeURIComponent(downloadFilename)}`
    )
      .then(response => response.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch(err => {
        console.error("Errore durante la conversione dell'immagine in SVG:", err);
        setErrorMessage("Invalid Spotify URL");
      });
  });
}

// Funzione helper per mostrare un messaggio d'errore in rosso
function setErrorMessage(message) {
  const outputDiv = document.getElementById("outputUri");
  outputDiv.innerHTML = `<span style="color: red;">${message}</span>`;
  // In caso di errore, rimuove anche la preview se presente
  document.getElementById("preview").innerHTML = "";
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
