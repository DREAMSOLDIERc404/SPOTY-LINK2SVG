const express = require('express');
const potrace = require('potrace');
const fetch = require('node-fetch');
const { promisify } = require('util');

// "Promisificare" potrace.trace
const trace = promisify(potrace.trace);

const app = express();

async function convertImageToSVG(url) {
  console.warn("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Errore durante il fetch dell'immagine");
    const buffer = await response.buffer();

    // Converti direttamente il buffer in SVG
    const svg = await trace(buffer, { turdSize: 100, alphaMax: 0.4 });
    return svg;
  } catch (err) {
    console.error("Errore durante la conversione dell'immagine in SVG:", err);
    throw err;
  }
}

app.get('convert', async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  try {
    const svg = await convertImageToSVG(url);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    res.status(500).send('Errore durante la conversione dell\'immagine in SVG');
  }
});

// Porta 3000 per lo sviluppo locale
app.listen(3000, () => {
  console.log('Server in ascolto sulla porta 3000');
});

module.exports = { convertImageToSVG };
