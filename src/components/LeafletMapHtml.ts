export const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Leaflet Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            overflow: hidden;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
        }
        #map { 
            width: 100%; 
            height: 100vh;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
        }
        .bike-marker {
            will-change: transform;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Optimize for mobile performance
        var map = L.map('map', {
            preferCanvas: true,
            zoomControl: false,
            attributionControl: false
        }).setView([37.78825, -122.4324], 16);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            minZoom: 10,
            tileSize: 256,
            zoomOffset: 0,
            detectRetina: true,
            updateWhenIdle: true,
            updateWhenZooming: false,
            keepBuffer: 2
        }).addTo(map);

        var currentPath = null;
        var currentMarker = null;
        var isFirstUpdate = true;
        var followMode = true;
        var lastUpdateTime = 0;
        var pathPoints = [];
        var maxPathPoints = 500; // Limit path points for performance

        // Optimized bike icon
        var bikeIcon = L.divIcon({
            html: '<div style="background: #10B981; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            className: 'bike-marker'
        });

        // Disable interactions that can cause performance issues
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();

        // Allow user to disable follow mode by dragging
        var dragTimeout;
        map.on('dragstart', function() {
            followMode = false;
            clearTimeout(dragTimeout);
            dragTimeout = setTimeout(function() {
                followMode = true;
            }, 8000);
        });

        function updateMap(data) {
            try {
                const { latitude, longitude, path } = JSON.parse(data);
                const currentTime = Date.now();

                // More aggressive throttling for mobile
                if (currentTime - lastUpdateTime < 2000 && !isFirstUpdate) {
                    return;
                }
                lastUpdateTime = currentTime;

                // Update Path with point limiting
                if (path && path.length > 1) {
                    // Limit path points for performance
                    var limitedPath = path.length > maxPathPoints ? 
                        path.slice(-maxPathPoints) : path;
                    
                    var latLngs = limitedPath.map(p => [p.latitude, p.longitude]);

                    if (currentPath) {
                        map.removeLayer(currentPath);
                    }

                    currentPath = L.polyline(latLngs, { 
                        color: '#10B981', 
                        weight: 3,
                        opacity: 0.7,
                        smoothFactor: 2,
                        noClip: true
                    }).addTo(map);
                }

                // Update Position
                if (latitude && longitude) {
                    var newLatLng = new L.LatLng(latitude, longitude);

                    if (currentMarker) {
                        currentMarker.setLatLng(newLatLng);
                    } else {
                        currentMarker = L.marker(newLatLng, { 
                            icon: bikeIcon,
                            riseOnHover: false
                        }).addTo(map);
                    }

                    // Optimized map following
                    if (isFirstUpdate) {
                        map.setView(newLatLng, 16);
                        isFirstUpdate = false;
                    } else if (followMode) {
                        var bounds = map.getBounds();
                        var padding = 0.001; // Smaller padding for better following
                        var paddedBounds = bounds.pad(-padding);
                        
                        if (!paddedBounds.contains(newLatLng)) {
                            map.panTo(newLatLng, {
                                animate: true,
                                duration: 0.8,
                                easeLinearity: 0.2
                            });
                        }
                    }
                }
            } catch (e) {
                // Silent error handling for performance
                if (window.console && console.error) {
                    console.error('Map update error:', e);
                }
            }
        }

        // Re-enable follow mode on tap
        map.on('click', function() {
            followMode = true;
            clearTimeout(dragTimeout);
            if (currentMarker) {
                map.panTo(currentMarker.getLatLng(), {
                    animate: true,
                    duration: 0.5
                });
            }
        });

        // Prevent context menu on long press
        map.on('contextmenu', function(e) {
            e.originalEvent.preventDefault();
            return false;
        });
    </script>
</body>
</html>
`
