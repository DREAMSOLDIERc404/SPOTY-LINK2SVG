import express from 'express';
import fetch from 'node-fetch';
import potrace from 'potrace';
import { promisify } from 'util';

// Promisifichiamo la funzione trace di Potrace per usarla con async/await
const trace = promisify(potrace.trace);

/**
 * In pratica, Potrace:
 * 1. Converte l’immagine in un percorso (o in un compound path con sottopercorsi)
 *    basandosi su parametri come `turdSize`, `alphaMax` e `turnPolicy`.
 * 2. Organizza i sottopercorsi all’interno di un singolo elemento <path>,
 *    lasciando al metodo di riempimento (ad es. fill-rule="evenodd") l’interpretazione
 *    di quali parti vanno riempite (e quali, per esempio, creino un buco).
 *
 * Quindi, se ad esempio il compound path contiene sia l’area esterna che
 * una o più aree interne (che si intersecano secondo regole geometriche), l’uso
 * di fill-rule="evenodd" potrà determinare che le zone interne (contate due volte)
 * non vengano riempite.
 */

const app = express();

async function convertImageToSVG(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Errore durante il fetch: ${response.statusText}`);
    }
    const buffer = await response.buffer();

    // Converte direttamente il buffer in SVG.
    // I parametri usati sono:
    //   - turdSize: ignora elementi piccoli/rumorosi
    //   - alphaMax: aumenta la tolleranza per semplificare le curve, rendendo le forme più morbide
    //   - turnPolicy: ad esempio 'minority' (puoi modificarlo in base alle tue esigenze)
    const svg = await trace(buffer, {
      turdSize: 100,
      alphaMax: 1,
      turnPolicy: 'minority'
    });

    // L'SVG restituito da Potrace è un compound path in cui tutti i sottopercorsi
    // sono raggruppati in un unico elemento <path>.
    // Se nell'SVG è presente l'attributo fill-rule="evenodd" (o se lo inserisci tu in fase di editing),
    // la regola determina quali parti riempire (ad esempio, creando degli “buchi” nei casi in cui
    // percorsi intersecanti generino contorni annidati).
    
    return svg;
  } catch (err) {
    console.error("Errore durante la conversione dell'immagine in SVG:", err);
    throw err;
  }
}

app.get('/api/convert', async (req, res) => {
  try {
    const imageUrl = decodeURIComponent(req.query.url);
    const svgOutput = await convertImageToSVG(imageUrl);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgOutput);
  } catch (err) {
    res.status(500).send("Errore nel convertire l'immagine in SVG.");
  }
});

// Avvio il server in ambiente di sviluppo. In produzione Vercel imposta il routing tramite il default export.
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server in ascolto sulla porta 3000');
  });
}

export default app;
