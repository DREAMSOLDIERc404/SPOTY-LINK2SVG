import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

// Promisifica potrace.trace
const trace = promisify(potrace.trace);

const app = express();

function separateCompoundPath(svgString) {
  // Estrae l'attributo d dal primo elemento <path> trovato nell'SVG
  const pathRegex = /<path[^>]+d="([^"]+)"/;
  const match = svgString.match(pathRegex);
  if (!match) {
    return svgString;
  }
  const dAttribute = match[1].trim();

  // Splitta la stringa "d" in subpaths: ogni subpath inizia con "M"
  let subpaths = dAttribute.match(/(M[^M]*)/g);
  if (!subpaths) {
    return svgString;
  }

  // Aggiungi immediatamente "z" alla fine di ogni subpath, se non già presente
  subpaths = subpaths.map((pathData) => {
    let trimmed = pathData.trim();
    if (!/[zZ]$/.test(trimmed)) {
      trimmed += "z";
    }
    return trimmed;
  });

  // Crea un nuovo elemento <path> per ogni subpath già chiuso correttamente
  const newPaths = subpaths
    .map((pathData) => `<path d="${pathData}" fill="#000000" stroke="none"/>`)
    .join("\n");

  // Ricompone l'SVG con header e gruppo
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="250" viewBox="0 0 1000 250" version="1.1">`;
  const groupOpen = `<g fill="#000000" stroke="none" fill-rule="evenodd">`;
  const svgClose = `</g>\n</svg>`;

  return `${svgHeader}\n${groupOpen}\n${newPaths}\n${svgClose}`;
}

async function convertImageToSVG(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
  const buffer = await response.buffer();

  let svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });

  // Applica subito la separazione e il merge con l'aggiunta dei "z"
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
    res.status(500).send("Errore durante la conversione dell'immagine in SVG");
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server in ascolto sulla porta 3000');
  });
}

export default app;
