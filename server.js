const potrace = require('potrace');
const fs = require('fs');
const fetch = require('node-fetch');
const express = require('express');
const app = express();

app.use(express.json());

async function convertImageToSVG(url, filename) {
  console.info("Funzione convertImageToSVG chiamata con URL:", url);
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const tempFile = 'temp.png';
    fs.writeFileSync(tempFile, buffer);
    potrace.trace(tempFile, { turdSize: 100, alphaMax: 0.4 }, function (err, svg) {
      if (err) {
        console.error("Errore durante la conversione dell'immagine in SVG:", err);
        throw err;
      }
      var blob = new Blob([svg], { type: 'image/svg+xml' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      fs.unlinkSync(tempFile);
    });
  } catch (err) {
    console.error("Errore durante la richiesta di fetch:", err);
  }
}

app.post('/api/convert', async (req, res) => {
  const { url, filename } = req.body;
  try {
    await convertImageToSVG(url, filename);
    res.status(200).send('Conversione completata');
  } catch (err) {
    res.status(500).send('Errore durante la conversione');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.info(`Server in ascolto sulla porta ${port}`);
});

module.exports = { convertImageToSVG };
