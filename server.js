const express = require('express');
const potrace = require('potrace');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
const logFile = 'server.log';

async function convertImageToSVG(url, filename) {
  fs.appendFileSync(logFile, `Funzione convertImageToSVG chiamata con URL: ${url}\n`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      fs.appendFileSync(logFile, `Errore durante il fetch dell'immagine: ${response.statusText}\n`);
      throw new Error(`Errore durante il fetch dell'immagine: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    const tempFile = 'temp.png';
    fs.writeFileSync(tempFile, buffer);
    potrace.trace(tempFile, { turdSize: 100, alphaMax: 0.4 }, function (err, svg) {
      if (err) {
        fs.appendFileSync(logFile, `Errore durante la conversione dell'immagine in SVG: ${err}\n`);
        throw err;
      }
      fs.unlinkSync(tempFile);
      return svg;
    });
  } catch (err) {
    fs.appendFileSync(logFile, `Errore durante la richiesta di fetch: ${err}\n`);
    throw err;
  }
}

app.get('/convert', async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  const filename = req.query.filename;
  fs.appendFileSync(logFile, `URL decodificato: ${url}\n`);
  try {
    const svg = await convertImageToSVG(url, filename);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    res.status(500).send('Errore durante la conversione dell\'immagine in SVG');
  }
});

app.get('/download-log', (req, res) => {
  res.download(logFile, 'server.log', (err) => {
    if (err) {
      console.error("Errore durante il download del file di log:", err);
      res.status(500).send('Errore durante il download del file di log');
    }
  });
});

app.listen(3000, () => {
  console.log('Server in ascolto sulla porta 3000');
});

module.exports = { convertImageToSVG };
