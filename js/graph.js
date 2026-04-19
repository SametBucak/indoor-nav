/**
 * graph.js
 * Graf inşası ve Dijkstra en kısa yol algoritması.
 * Bu modül tamamen bağımsızdır — DOM veya canvas bilgisi yoktur.
 */

/**
 * Kenar listesinden çift yönlü adjacency graph oluşturur.
 * @param {boolean} wheelchairMode - true ise merdiven ve yürüyen merdiven kenarları hariç tutulur
 * @returns {Object} id → [{to, dist, type}] formatında graph
 */
function buildGraph(wheelchairMode = false) {
  const forbidden = wheelchairMode ? new Set(["stair", "escalator"]) : new Set();
  const graph = {};
  NODES.forEach((n) => (graph[n.id] = []));

  EDGES.forEach((e) => {
    if (e.from_id === e.to_id) return;           // self-loop, atla
    if (forbidden.has(e.accesstype)) return;     // erişilemez kenar

    const d = e.distance || 10;
    graph[e.from_id].push({ to: e.to_id,   dist: d, type: e.accesstype });
    graph[e.to_id].push(  { to: e.from_id, dist: d, type: e.accesstype });
  });

  return graph;
}

/**
 * Dijkstra algoritması ile en kısa yolu bulur.
 * @param {Object} graph  - buildGraph() çıktısı
 * @param {number} startId - başlangıç node id'si
 * @param {number} endId   - hedef node id'si
 * @returns {{ path: Array, totalDist: number } | null}
 */
function dijkstra(graph, startId, endId) {
  const dist   = {};
  const prev   = {};
  const ptype  = {};

  NODES.forEach((n) => {
    dist[n.id]  = Infinity;
    prev[n.id]  = null;
    ptype[n.id] = null;
  });

  dist[startId] = 0;
  const pq = [{ id: startId, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { id: u } = pq.shift();
    if (u === endId) break;

    (graph[u] || []).forEach(({ to, dist: w, type }) => {
      const alt = dist[u] + w;
      if (alt < dist[to]) {
        dist[to]  = alt;
        prev[to]  = u;
        ptype[to] = type;
        pq.push({ id: to, d: alt });
      }
    });
  }

  if (dist[endId] === Infinity) return null;

  // Geri izleme ile tam yolu oluştur
  const path = [];
  let cur = endId;
  while (cur !== null) {
    path.unshift({ id: cur, type: ptype[cur] });
    cur = prev[cur];
  }

  return { path, totalDist: dist[endId] };
}

/** Yardımcı: id'ye göre node döner */
function nodeById(id) {
  return NODES.find((n) => n.id === id);
}
