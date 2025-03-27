function convertImageToSVG(url, filename) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        var imageData = ctx.getImageData(0, 0, img.width, img.height);
        var potrace = new Potrace();
        potrace.loadImageData(imageData);
        potrace.process();
        var svg = potrace.getSVG();

        var blob = new Blob([svg], {type: 'image/svg+xml'});
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
}

// Aggiungi un listener per il bottone di submit
document.getElementById('submitButton').addEventListener('click', convertUrlToUri);
