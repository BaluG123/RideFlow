export const LEAFLET_HTML = `
<!DOCTYPE html >
    <html>
    <head>
    <title>Leaflet Map </title>
        < meta charset = "utf-8" />
            <meta name="viewport" content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin = "" />
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin = "" > </script>
                        <style>
        body { margin: 0; padding: 0; }
#map { width: 100 %; height: 100vh; }
</style>
    </head>
    < body >
    <div id="map" > </div>
        <script>
var map = L.map('map').setView([37.78825, -122.4324], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var currentPath = null;
var currentMarker = null;

// Custom icon for current position
var bikeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3714/3714324.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

function updateMap(data) {
    try {
        const { latitude, longitude, path } = JSON.parse(data);

        // Update Path
        if (path && path.length > 0) {
            var latLngs = path.map(p => [p.latitude, p.longitude]);

            if (currentPath) {
                map.removeLayer(currentPath);
            }

            currentPath = L.polyline(latLngs, { color: '#10B981', weight: 5 }).addTo(map);
        }

        // Update Position
        if (latitude && longitude) {
            var newLatLng = new L.LatLng(latitude, longitude);

            if (currentMarker) {
                currentMarker.setLatLng(newLatLng);
            } else {
                currentMarker = L.marker(newLatLng, { icon: bikeIcon }).addTo(map);
            }

            map.setView(newLatLng, 16); // Follow user
        }
    } catch (e) {
        // console.error(e);
    }
}

// Listen for messages from React Native
// window.addEventListener('message', function(event) {
//    updateMap(event.data);
// });
// Poll for message handler or just rely on direct function call injection
</script>
    </body>
    </html>
`
