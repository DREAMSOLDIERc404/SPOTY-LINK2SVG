// server.js


import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

const trace = promisify(potrace.trace);
const app = express();

/**
 * Endpoint per recuperare i dettagli di una traccia.
 * Usa client credentials flow per ottenere un access token e poi chiama l’API Spotify.
 */
app.get('/api/track', async (req, res) => {
  const trackId = req.query.trackId;
  if (!trackId) {
    return res.status(400).send("Missing trackId parameter.");
  }

  try {
    // Ottiene l'access token usando client credentials flow
    //Le variabili le trovi in VERCEL nella parte di Environment Variables
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");

    const token = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!token.ok) {
      console.error("Errore nel client credentials flow:", tokenResponse.status);
      return res.status(tokenResponse.status).send("Errore nel recuperare l'access token.");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Ora usa il token per ottenere i dettagli della traccia
    const trackUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
    const trackResponse = await fetch(trackUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!trackResponse.ok) {
      console.error("Errore nel recupero della traccia:", trackResponse.status);
      return res.status(trackResponse.status).send("Errore nel recupero della traccia.");
    }

    const trackData = await trackResponse.json();
    return res.json(trackData);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

/**
 * Funzione che separa ed unisce i subpaths di un SVG generato da potrace:
 * - Estrae il valore "d" dal primo <path>.
 * - Divide in subpaths (segmenti che iniziano con "M").
 * - Aggiunge "z" a ciascun subpath se non presente.
 * - Unisce i subpaths per ricostruire l'SVG.
 */
function separateCompoundPath(svgString) {
  const pathRegex = /<path[^>]+d="([^"]+)"/;
  const match = svgString.match(pathRegex);
  if (!match) {
    return svgString;
  }
  const dAttribute = match[1].trim();
  let subpaths = dAttribute.match(/(M[^M]*)/g);
  if (!subpaths) {
    return svgString;
  }
  subpaths = subpaths.map(subpath => {
    let trimmed = subpath.trim();
    if (!/[zZ]$/.test(trimmed)) {
      trimmed += "z";
    }
    return trimmed;
  });
  const mergedD = subpaths.join(" ");
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="250" viewBox="0 0 1000 250" version="1.1">`;
  const newPath = `<path d="${mergedD}" fill="#000000" fill-rule="evenodd" stroke="none"/>`;
  const svgClose = `</svg>`;
  return `${svgHeader}\n${newPath}\n${svgClose}`;
}

/**
 * Converte un'immagine (da URL) in SVG tramite potrace e applica la correzione dei subpaths.
 */
async function convertImageToSVG(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
  // Usa arrayBuffer() per ottenere un ArrayBuffer e poi lo converte in un Buffer
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });
  svg = separateCompoundPath(svg);
  return svg;
}

/**
 * Endpoint per la conversione dell'immagine in SVG.
 * Riceve l'URL dell'immagine (lo Spotify Code in PNG) e il filename come query string.
 */
app.get('/api/convert', async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  const filename = req.query.filename ? req.query.filename : 'spotify_code.svg';
  try {
    const svg = await convertImageToSVG(url);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la conversione dell'immagine in SVG");
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('Server in ascolto sulla porta 3000'));
}

export default app;
