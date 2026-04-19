/**
 * data.js
 * GeoJSON dosyalarını (EPSG:3857) okur, WGS84'e dönüştürür
 * ve global NODES / EDGES / GEO_BOUNDS sabitlerini oluşturur.
 *
 * Bağımlılık: assets/nodes.geojson, assets/edges.geojson
 */

const GEO_BOUNDS = {
  0: {
    minLng: 28.9444568305183694,
    maxLng: 28.9458335939645579,
    minLat: 40.8850601260030402,
    maxLat: 40.8857653973892283,
  },
  1: {
    minLng: 28.9444638863136916,
    maxLng: 28.9458377672651501,
    minLat: 40.8850522150948450,
    maxLat: 40.8857627019654188,
  },
};

// Çalışma zamanında doldurulacak — loadData() tamamlandıktan sonra hazır olur
let NODES = [];
let EDGES = [];

// ------------------------------------------------------------------
// Koordinat dönüşümü: EPSG:3857 (Web Mercator) → WGS84
// ------------------------------------------------------------------
function mercToWgs84(x, y) {
  const lng = (x / 20037508.34) * 180;
  const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) / Math.PI) * 360 - 90;
  return { lat, lng };
}

// ------------------------------------------------------------------
// GeoJSON dosyalarını yükle ve parse et
// ------------------------------------------------------------------
async function loadData() {
  const [nodesRes, edgesRes] = await Promise.all([
    fetch("assets/nodes.geojson"),
    fetch("assets/edges.geojson"),
  ]);

  if (!nodesRes.ok) throw new Error("nodes.geojson yüklenemedi");
  if (!edgesRes.ok) throw new Error("edges.geojson yüklenemedi");

  const nodesGeo = await nodesRes.json();
  const edgesGeo = await edgesRes.json();

  // Node'ları dönüştür
  NODES = nodesGeo.features.map((f) => {
    const [x, y] = f.geometry.coordinates;
    const { lat, lng } = mercToWgs84(x, y);
    return {
      id:    f.properties.id,
      name:  f.properties.name,
      floor: f.properties.floor,
      type:  f.properties.type,
      lat,
      lng,
    };
  });

  // Edge'leri dönüştür
  EDGES = edgesGeo.features.map((f) => ({
    from_id:    f.properties.from_id,
    to_id:      f.properties.to_id,
    distance:   f.properties.distance,
    floor:      f.properties.floor,
    accesstype: f.properties.accesstype,
  }));
}
