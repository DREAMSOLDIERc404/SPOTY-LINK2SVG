import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

// Promisifica potrace.trace
const trace = promisify(potrace.trace);

const app = express();

/**
 * Funzione che riceve il contenuto SVG generato da Potrace e, se vi
 * è un unico elemento <path> contenente subpath (cioè più comandi "M"),
 * li separa in più <path> distinti.
 */
function separateCompoundPath(svgString) {
  // Esempio: l'SVG generato è simile a:
  // <svg xmlns="http://www.w3.org/2000/svg" ...>
  //   <path d="M113.500 50.644 ... M656.223 112.557 ... M749 113 ..." stroke="none" fill="black" fill-rule="evenodd"/>
  // </svg>
  //
  // Estraiamo il contenuto dell'attributo d.
  const pathRegex = /<path([^>]+)d="([^"]+)"([^>]*)\/?>/;
  const match = svgString.match(pathRegex);
  if (!match) {
    // Se non troviamo un <path>, restituiamo lo SVG originale
    return svgString;
  }
  const dAttribute = match[2].trim();

  // Splitta il contenuto in subpath: ogni nuovo oggetto dovrebbe iniziare con un "M"
  // Usando la regex /M[^M]+/g troviamo tutte le occorrenze che partono con "M" seguite da tutto (fino al prossimo "M")
  const subpaths = dAttribute.match(/M[^M]+/g);
  
  // Se non viene trovato più di un subpath, non serve alcuna separazione
  if (!subpaths || subpaths.length <= 1) {
    return svgString; 
  }
  
  // Per ciascuno subpath, creiamo un nuovo elemento <path> con gli attributi base (qui stampiamo fill e stroke fissi)
  const newPaths = subpaths
    .map(pathD => `<path d="${pathD.trim()}" stroke="none" fill="black"/>`)
    .join('\n');

  // Ora, ricostruiamo l'SVG mantenendo eventuali attributi del tag <svg> originale
  const svgOpenTagMatch = svgString.match(/<svg([^>]*)>/);
  const svgOpenTag = svgOpenTagMatch ? `<svg${svgOpenTagMatch[1]}>` : `<svg>`;
  const svgCloseTag = '</svg>';

  // Incapsuliamo tutti i nuovi <path> in un gruppo <g>
  const newSvg = `${svgOpenTag}
  <g>
    ${newPaths}
  </g>
${svgCloseTag}`;
  
  return newSvg;
}

async function convertImageToSVG(url) {
  console.warn("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
    const buffer = await response.buffer();

    // Converti direttamente il buffer in SVG
    let svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });
    
    // Applichiamo la post-elaborazione per separare i vari oggetti in base al comando "M"
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

// Avvia il server in ambiente di sviluppo; in produzione Vercel gestirà il routing
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server in ascolto sulla porta 3000');
  });
}

// Esportiamo l'app come default export per l'ambiente serverless di Vercel
export default app;
