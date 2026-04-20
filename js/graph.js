
function buildGraph(wheelchairMode = false) {
  const forbidden = wheelchairMode ? new Set(["stair", "escalator"]) : new Set();
  const graph = {};
  NODES.forEach((n) => (graph[n.id] = []));

  EDGES.forEach((e) => {
    if (e.from_id === e.to_id) return;           
    if (forbidden.has(e.accesstype)) return;     

    const d = e.distance || 10;
    graph[e.from_id].push({ to: e.to_id,   dist: d, type: e.accesstype });
    graph[e.to_id].push(  { to: e.from_id, dist: d, type: e.accesstype });
  });

  return graph;
}



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


  const path = [];
  let cur = endId;
  while (cur !== null) {
    path.unshift({ id: cur, type: ptype[cur] });
    cur = prev[cur];
  }

  return { path, totalDist: dist[endId] };
}


function nodeById(id) {
  return NODES.find((n) => n.id === id);
}
