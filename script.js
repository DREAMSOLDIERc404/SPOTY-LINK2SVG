document.getElementById('submitButton').addEventListener('click', convertUrlToUri);

function convertUrlToUri() {
    var url = document.getElementById("spotifyLink").value;
    var parts = url.split('/');
    if (parts.length < 5 || parts[2] !== "open.spotify.com") {
        document.getElementById("outputUri").innerHTML = 'Invalid Spotify URL.';
        return;
    } else {
        document.getElementById("outputUri").innerHTML = "CLICCA SULL'IMMAGINE PER VEDERE IL CONTENUTO RAW IN ASCII";
    }

    var type = parts[3];
    var id = parts[4].split('?')[0]; // Remove any query parameters
    var uri = 'spotify:' + type + ':' + id;
    displaySpotifyCode(uri);
    console.log("Spotify URI generato: " + uri);
}

function displaySpotifyCode(uri) {
    var spotifyCodeUrl = `https://scannables.scdn.co/uri/plain/png/000000/white/1000/${encodeURIComponent(uri)}`;
    var img = document.createElement('img');
    img.src = spotifyCodeUrl;
    img.alt = 'Spotify Code';
    img.style.width = '320px';
    img.style.height = 'auto';
    img.style.cursor = 'pointer';

    img.addEventListener('click', function() {
        fetch(spotifyCodeUrl)
            .then(response => response.blob())
            .then(blob => {

                var formData = new FormData();
                formData.append("Fl", "21650");
                formData.append("F", blob, "spcode.png"); // Attach the image blob
                formData.append("C", "en");
                formData.append("A", "False");
                formData.append("V", "False");
                formData.append("W", "0");
                formData.append("JS", "fVUIvzxS53VW5yG8HxA6lg--");
                formData.append("Pa", "/convert/file/png/to/stl");
                formData.append("S", "png");
                formData.append("T", "stl");
                formData.append("LockAspect", "True");
                formData.append("Mode", "HeightMap");
                formData.append("Detail", "Medium");
                formData.append("AddBase", "0");
                formData.append("UnitOfMeasurement", "Millimeters");
                formData.append("X", "100");
                formData.append("Y", "24.93333");
                formData.append("Z", "10");
                formData.append("ColorMode", "NormalGreyscale");
                formData.append("MergeSimilarColors", "0");
                formData.append("TraceHoleReduction", "Auto");
                formData.append("TransparencyConversion", "");
                formData.append("GeneratePreview", "True");
                formData.append("ToId", "stl");
                formData.append("STLFormatOptions", "Standard");
                formData.append("NormalGenerationOptions", "Face");
                formData.append("ImageManualWidth", "");
                formData.append("ImageManualHeight", "");
                formData.append("U", "True");
                formData.append("CT", "0");
                formData.append("key", "a6147b04-6f64-46f2-aaa2-bd51cabe6182");

                fetch('https://senseidownload.com/Api/V1/Process/ConvertFileBinary/628cd6d0-32d1-2415-3d32-90a484cc4cc1', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.text()) // Change to response.text() to get the response as text
                .then(data => {
                    var outputDiv = document.getElementById("outputUri");
                    outputDiv.innerText = data; // Print the response text to the outputDiv
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            });
    });

    var previewDiv = document.getElementById("preview");
    previewDiv.innerHTML = ''; // Clear previous content
    previewDiv.appendChild(img);
}
