// client.js

// Nel caso il client riceva l'access token come parametro nella URL (dopo il callback),
// lo salva in una variabile globale.
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("accessToken")) {
    window.accessToken = urlParams.get("accessToken");
    console.log("AccessToken recuperato dal callback:", window.accessToken);
  }
})();

// Se non esiste già un access token, mostra un link per il login a Spotify.
// NOTA: Il Client ID qui è hard-coded. In ambiente di produzione potresti
// volerlo inserire in un file di configurazione (o durante il processo di build).
function displayLoginLink() {
  const clientId = "dfa218e2b3464f14b66ef04022172359"; // Sostituisci con il tuo Client ID pubblico
  const redirectUri = "https://spoty-linkhttp2svg.vercel.app/callback";
  const scopes = "user-read-private user-read-email";
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scopes)}`;

  const loginDiv = document.getElementById("login");
  loginDiv.innerHTML = `<a href="${authUrl}">Login con Spotify</a>`;
}

if (!window.accessToken) {
  displayLoginLink();
}

async function convertUrlToUri() {
  console.log("Funzione convertUrlToUri chiamata");
  const url = document.getElementById("spotifyLink").value;
  console.log("URL inserito:", url);
  const parts = url.split('/');

  if (parts.length < 5 || parts[2] !== "open.spotify.com") {
    console.log("URL non valido");
    document.getElementById("outputUri").innerHTML = 'Invalid Spotify URL.';
    return;
  }

  document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";

  // Estrazione dell'ID e del tipo (gestisce il caso con "intl-it")
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

  // Recupera il nome della traccia tramite l'API Spotify se abbiamo l'access token.
  // Se l'access token non è disponibile, verrà usato un nome di default.
  let trackName = 'spotify_code';
  const accessToken = window.accessToken;
  if (accessToken) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const track = await response.json();
        // Sanitizza il nome della traccia: rimpiazza i caratteri non alfanumerici con "_"
        trackName = track.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      } else {
        console.error("Errore nell'API Spotify:", response.status);
      }
    } catch (err) {
      console.error("Errore nel recupero dei dettagli della traccia:", err);
    }
  } else {
    console.warn("Token di accesso non disponibile. Effettua il login con Spotify.");
  }

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
      .catch(err => console.error("Errore durante la conversione dell'immagine in SVG:", err));
  });

  document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER SCARICARE L'SVG";
  const previewDiv = document.getElementById("preview");
  previewDiv.innerHTML = '';
  previewDiv.appendChild(img);
}

document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
