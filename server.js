import express from 'express';
import potrace from 'potrace';
import fetch from 'node-fetch';
import { promisify } from 'util';

// Promisifica potrace.trace
const trace = promisify(potrace.trace);

const app = express();

async function convertImageToSVG(url) {
  console.warn("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
    const buffer = await response.arrayBuffer();

    // Converti direttamente il buffer in SVG
    const svg = await trace(buffer, { turdSize: 100, alphaMax: 1 });
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

// Avvia il server in locale solo se non siamo in ambiente di produzione
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server in ascolto sulla porta 3000');
  });
}

// Esporta solo il default export per Vercel; 
// l'export named di convertImageToSVG è stato rimosso perché non serve
export default app;
