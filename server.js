import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

// Promisifica potrace.trace
const trace = promisify(potrace.trace);

const app = express();

/**
 * Funzione che prende l'SVG generato da Potrace e, se il tag <path>
 * contiene più subpath (cioè più comandi "M"), li separa in singoli
 * elementi <path> e poi costruisce un output SVG con la struttura
 * desiderata.
 */
function separateCompoundPath(svgString) {
  // Cerchiamo di estrarre l'attributo "d" del primo <path>
  const pathRegex = /<path[^>]+d="([^"]+)"/;
  const match = svgString.match(pathRegex);
  if (!match) {
    // Se non si trova un <path>, restituiamo lo SVG originale
    return svgString;
  }
  const dAttribute = match[1].trim();

  // Splitta il contenuto in subpath: ogni oggetto dovrebbe iniziare con "M"
  const subpaths = dAttribute.match(/M[^M]+/g);
  if (!subpaths || subpaths.length <= 1) {
    // Se troviamo solo un subpath, non è necessaria la separazione
    return svgString;
  }

  // Per ciascun subpath, creiamo un nuovo <path>
  const newPaths = subpaths
    .map(pathData => `<path d="${pathData.trim()}z"/>`)
    .join("\n");

  // Costruiamo l'header e la struttura finale in modo simile al file di esempio
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="250" viewBox="0 0 1000 250" version="1.1">`;

  const groupOpen = `<g transform="translate(0.000000,250.000000) scale(0.100000,-0.100000)"
fill="#000000" stroke="none">`;
  const svgClose = `</g>
</svg>`;

  // Uniamo tutto in un'unica stringa
  const newSvg = `${svgHeader}
${groupOpen}
${newPaths}
${svgClose}
`;
  return newSvg;
}

/**
 * Converte l'immagine (buffer) in SVG utilizzando Potrace e poi
 * esegue la post-elaborazione per separare i vari oggetti.
 */
async function convertImageToSVG(url) {
  console.warn("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
    const buffer = await response.buffer();

    // Converti direttamente il buffer in SVG con Potrace
    let svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });
    
    // Applichiamo la post-elaborazione per separare i vari subpath
    svg = separateCompoundPath(svg);
    
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
