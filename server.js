// server.js

import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

const trace = promisify(potrace.trace);
const app = express();

/**
 * Endpoint per gestire il callback di Spotify.
 * Riceve il parametro "code" e lo scambia per un access token, utilizzando le variabili d'ambiente.
 */
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Missing code parameter.");
  }

  // Estrae le credenziali dall'ambiente; queste variabili devono essere definite su Vercel.
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "https://spoty-linkhttp2svg.vercel.app/callback";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenUrl = "https://accounts.spotify.com/api/token";

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      console.error("Errore nello scambio del codice per il token:", tokenResponse.status);
      return res.status(tokenResponse.status).send("Errore nello scambio del codice per il token.");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Dopo lo scambio, reindirizza l'utente alla home passando l'access token nella query string.
    return res.redirect(`/?accessToken=${accessToken}`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

/**
 * Funzione che separa i subpaths di un SVG generato da potrace:
 * - Estrae il valore "d" dal primo <path>.
 * - Divide in subpaths (segmenti che iniziano con "M").
 * - Aggiunge "z" a ciascun subpath se non già presente.
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
 * Converte un'immagine presa da un URL (ad es. lo Spotify Code in PNG)
 * in formato SVG tramite potrace e applica la funzione per correggere i subpaths.
 */
async function convertImageToSVG(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
  const buffer = await response.buffer();

  let svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });
  svg = separateCompoundPath(svg);
  return svg;
}

/**
 * Endpoint per la conversione dell'immagine in SVG.
 * Riceve tramite query string l'URL dell'immagine da convertire e il filename desiderato.
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
