// client.js

async function convertUrlToUri() {
  console.log("Funzione convertUrlToUri chiamata");
  
  // Ogni volta che premiamo il tasto, rimuoviamo qualsiasi preview o messaggio precedente.
  document.getElementById("preview").innerHTML = "";
  document.getElementById("outputUri").innerHTML = "";

  const url = document.getElementById("spotifyLink").value;
  console.log("URL inserito:", url);
  const parts = url.split('/');

  // Controllo di formato base dell'URL Spotify
  if (parts.length < 5 || parts[2] !== "open.spotify.com") {
    console.log("URL non valido");
    setErrorMessage("Invalid Spotify URL");
    return;
  }

  // Messaggio predefinito prima del risultato
  document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";

  // Estrazione dell'ID e del tipo (gestendo il caso "intl-it")
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
      // Sanitizza il nome della traccia: rimpiazza i caratteri non alfanumerici con "_"
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

  // Visualizza lo Spotify Code e abilita il download dell'SVG al click
  displaySpotifyCode(uri, `${trackName}.svg`);
}

function displaySpotifyCode(uri, downloadFilename) {
  console.log("Funzione displaySpotifyCode chiamata con URI:", uri);
  const spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
  const spotifyCodeUrlSVG = `https://scannables.scdn.co/uri/plain/png/FFFFFF/black/1000/${encodeURIComponent(uri)}`;

  const img = document.createElement('img');
  img.src = spotifyCodeUrl;
  img.alt = 'Spotify Code';
  img.style.width = '320px';
  img.style.height = 'auto';
  img.style.cursor = 'pointer';

  // Se l'immagine non viene caricata, segnala l'errore
  img.onerror = () => {
    console.error("Immagine non trovata.");
    setErrorMessage("Invalid Spotify URL");
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

  // Visualizza la preview dell'immagine e il messaggio di download
  document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
  const previewDiv = document.getElementById("preview");
  previewDiv.innerHTML = ''; // giustifica ulteriormente la rimozione del contenuto precedente
  previewDiv.appendChild(img);
}

// Funzione di utilità per mostrare un messaggio di errore in rosso
function setErrorMessage(message) {
  const outputDiv = document.getElementById("outputUri");
  outputDiv.innerHTML = `<span style="color: red;">${message}</span>`;
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
