const potrace = require('potrace');
const fs = require('fs');
const fetch = require('node-fetch');

async function convertImageToSVG(url, filename) {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const tempFile = 'temp.png';
    fs.writeFileSync(tempFile, buffer);
    potrace.trace(tempFile, { turdSize: 100, alphaMax: 0.4 }, function (err, svg) {
      if (err) throw err;
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
    console.error(err);
  }
}

module.exports = { convertImageToSVG };
