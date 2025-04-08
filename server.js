import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

// Promisifica potrace.trace
const trace = promisify(potrace.trace);

const app = express();

/**
 * Funzione per verificare se due bounding box si sovrappongono.
 */
function boundingBoxesOverlap(box1, box2) {
  return !(
    box1.maxX < box2.minX ||
    box1.minX > box2.maxX ||
    box1.maxY < box2.minY ||
    box1.minY > box2.maxY
  );
}

/**
 * Funzione per calcolare la bounding box di un singolo subpath.
 */
function calculateBoundingBox(subpath) {
  const commands = subpath.match(/[MLC]\s*-?\d+(\.\d+)?\s*-?\d+(\.\d+)?/g);
  if (!commands) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  commands.forEach(command => {
    const [, x, y] = command.split(/\s+/).map(Number);
    if (x !== undefined && y !== undefined) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Funzione che unisce subpath che si sovrappongono basandosi sulle bounding box.
 */
function mergeOverlappingSubpaths(subpaths) {
  const boundingBoxes = subpaths.map(calculateBoundingBox);
  const mergedPaths = [];
  const visited = new Array(subpaths.length).fill(false);

  for (let i = 0; i < subpaths.length; i++) {
    if (visited[i]) continue;

    let combinedPath = subpaths[i];
    visited[i] = true;

    for (let j = i + 1; j < subpaths.length; j++) {
      if (visited[j]) continue;

      if (boundingBoxesOverlap(boundingBoxes[i], boundingBoxes[j])) {
        combinedPath += ` ${subpaths[j]}`;
        visited[j] = true;
      }
    }

    mergedPaths.push(combinedPath);
  }

  return mergedPaths;
}

/**
 * Funzione che separa i sottopercorsi (subpaths) e unisce quelli che si toccano.
 */
function separateAndMergeCompoundPaths(svgString) {
  const pathRegex = /<path[^>]+d="([^"]+)"/;
  const match = svgString.match(pathRegex);
  if (!match) {
    return svgString;
  }
  const dAttribute = match[1].trim();

  // Splitta il compound path in subpaths
  const subpaths = dAttribute.match(/M[^M]+/g);
  if (!subpaths || subpaths.length <= 1) {
    return svgString;
  }

  // Unisci subpath che si toccano
  const mergedPaths = mergeOverlappingSubpaths(subpaths);

  // Crea un nuovo SVG con i percorsi uniti
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="250" viewBox="0 0 1000 250" version="1.1">`;
  const groupOpen = `<g fill="#000000" stroke="none" fill-rule="evenodd">`;
  const svgClose = `</g>
</svg>`;

  const newPaths = mergedPaths
    .map(pathData => `<path d="${pathData.trim()}z"/>`)
    .join("\n");

  return `${svgHeader}
${groupOpen}
${newPaths}
${svgClose}`;
}

/**
 * Converte l'immagine (buffer) in SVG utilizzando Potrace e poi
 * unisce i subpath che si sovrappongono.
 */
async function convertImageToSVG(url) {
  console.warn("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
    const buffer = await response.buffer();

    // Converti direttamente il buffer in SVG con Potrace
    let svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });

    // Unisci i subpath che si sovrappongono
    svg = separateAndMergeCompoundPaths(svg);

    return svg;
  } catch (err) {
    console.error("Errore durante la conversione dell'immagine in SVG:", err);
    throw err;
  }
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

// Avvia il server in ambiente di sviluppo; in produzione Vercel gestisce il routing
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server in ascolto sulla porta 3000');
  });
}

export default app;
