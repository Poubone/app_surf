/** HTML Leaflet embarqué — évite react-native-maps (crash Android à l'init). */
export const LEAFLET_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #070c16; }
    .surf-pin {
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; font-weight: 700; font-family: system-ui, sans-serif;
      border: 2px solid; box-sizing: border-box;
    }
    .surf-pin--scored { width: 34px; height: 34px; font-size: 10px; }
    .surf-pin--dot { width: 8px; height: 8px; border-width: 1px; opacity: 0.85; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function scoreColor(score) {
      if (score >= 80) return '#00e5a0';
      if (score >= 60) return '#00c4ff';
      if (score >= 30) return '#ffb84d';
      return '#ff5252';
    }

    var map = L.map('map', { zoomControl: false, attributionControl: false })
      .setView([46.5, 2.5], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var layer = L.layerGroup().addTo(map);
    var allPins = [];

    function visiblePins() {
      var zoom = map.getZoom();
      if (zoom <= 6) return allPins.filter(function(p) { return p.hasScore; });
      var bounds = map.getBounds();
      var inView = allPins.filter(function(p) {
        return bounds.contains([p.latitude, p.longitude]);
      });
      return inView.length > 100 ? inView.slice(0, 100) : inView;
    }

    function render() {
      layer.clearLayers();
      visiblePins().forEach(function(p) {
        var color = p.hasScore ? scoreColor(p.score) : 'rgba(232,237,245,0.45)';
        if (p.hasScore) {
          var icon = L.divIcon({
            className: '',
            html: '<div class="surf-pin surf-pin--scored" style="background:' + color + '33;border-color:' + color + ';color:' + color + '">' + p.score + '</div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          });
          L.marker([p.latitude, p.longitude], { icon: icon })
            .on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', id: p.id }));
            })
            .addTo(layer);
        } else {
          var dot = L.divIcon({
            className: '',
            html: '<div class="surf-pin surf-pin--dot" style="background:rgba(232,237,245,0.45);border-color:rgba(255,255,255,0.25)"></div>',
            iconSize: [8, 8],
            iconAnchor: [4, 4]
          });
          L.marker([p.latitude, p.longitude], { icon: dot })
            .on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin', id: p.id }));
            })
            .addTo(layer);
        }
      });
    }

    map.on('moveend zoomend', render);

    window.setPins = function(pins) {
      allPins = pins || [];
      render();
    };

    document.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'setPins') window.setPins(data.pins);
      } catch (err) {}
    });
    window.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'setPins') window.setPins(data.pins);
      } catch (err) {}
    });
  </script>
</body>
</html>`;
