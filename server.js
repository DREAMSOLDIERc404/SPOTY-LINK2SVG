const express = require('express');
const potrace = require('potrace');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();

async function convertImageToSVG(url, filename) {
  console.log("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Errore durante il fetch dell'immagine:", response.statusText);
      throw new Error(`Errore durante il fetch dell'immagine: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    const tempFile = 'temp.png';
    fs.writeFileSync(tempFile, buffer);
    potrace.trace(tempFile, { turdSize: 100, alphaMax: 0.4 }, function (err, svg) {
      if (err) {
        console.error("Errore durante la conversione dell'immagine in SVG:", err);
        throw err;
      }
      fs.unlinkSync(tempFile);
      return svg;
    });
  } catch (err) {
    console.error("Errore durante la richiesta di fetch:", err);
    throw err;
  }
}

app.get('/convert', async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  const filename = req.query.filename;
  console.log("URL decodificato:", url); // Log dell'URL decodificato
  try {
    const svg = await convertImageToSVG(url, filename);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    res.status(500).send('Errore durante la conversione dell\'immagine in SVG');
  }
});

app.listen(3000, () => {
  console.log('Server in ascolto sulla porta 3000');
});

module.exports = { convertImageToSVG };