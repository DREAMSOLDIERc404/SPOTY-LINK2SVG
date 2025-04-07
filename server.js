const potrace = require('potrace');
const fs = require('fs');
const fetch = require('node-fetch');

async function convertImageToSVG(url, filename) {
  console.log("Funzione convertImageToSVG chiamata con URL:", url);
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

module.exports = { convertImageToSVG };
