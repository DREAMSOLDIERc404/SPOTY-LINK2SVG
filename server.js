import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

// Promisifica potrace.trace per utilizzare async/await
const trace = promisify(potrace.trace);

const app = express();

/**
 * Funzione che gestisce la separazione e il merge dei subpaths.
 * 1. Estrae l'attributo 'd' dal primo <path> dell'SVG.
 * 2. Splitta la stringa in subpaths (ogni segmento che inizia con "M").
 * 3. Aggiunge immediatamente "z" ad ogni subpath se non presente.
 * 4. Mette insieme tutti i subpaths in un unico comando "d".
 * 5. Ricostruisce l'SVG con un unico elemento <path> contenente il d attribute merge.
 */
function separateCompoundPath(svgString) {
  // Estrai il d attribute dal primo <path>
  const pathRegex = /<path[^>]+d="([^"]+)"/;
  const match = svgString.match(pathRegex);
  if (!match) {
    return svgString;
  }
  const dAttribute = match[1].trim();

  // Split: dividi in subpaths, ciascuno che inizia con "M"
  let subpaths = dAttribute.match(/(M[^M]*)/g);
  if (!subpaths) {
    return svgString;
  }

  // Immediatamente aggiungi "z" ad ogni subpath se non è già presente
  subpaths = subpaths.map(subpath => {
    let trimmed = subpath.trim();
    if (!/[zZ]$/.test(trimmed)) {
      trimmed += "z";
    }
    return trimmed;
  });

  // Merge: concatenare tutti i subpaths in un unico d attribute
  const mergedD = subpaths.join(" ");

  // Ricomponi l'SVG con un unico elemento <path> che usa il d attribute merge
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="250" viewBox="0 0 1000 250" version="1.1">`;
  const newPath = `<path d="${mergedD}" fill="#000000" stroke="none"/>`;
  const svgClose = `</svg>`;

  return `${svgHeader}\n${newPath}\n${svgClose}`;
}

async function convertImageToSVG(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
  const buffer = await response.buffer();

  // Conversione dell'immagine in SVG tramite potrace
  let svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });
  
  // Esegui subito la separazione, l'aggiunta dei "z" e il merge dei subpaths
  svg = separateCompoundPath(svg);
  return svg;
}

app.get('/api/convert', async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  try {
    const svg = await convertImageToSVG(url);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore durante la conversione dell'immagine in SVG");
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server in ascolto sulla porta 3000');
  });
}

export default app;
