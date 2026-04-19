/**
 * ui.js
 * Sidebar etkileşimleri: mağaza seçimi, erişilebilirlik toggle,
 * rota hesaplama butonu ve adım adım talimat listesi.
 */

const STEP_ICONS = {
  walk:     "🚶",
  elevator: "🛗",
  escalator:"↗️",
  stair:    "🪜",
  dest:     "🎯",
};

class UI {
  /**
   * @param {Renderer} renderer
   */
  constructor(renderer) {
    this.renderer      = renderer;
    this.selectedDest  = null;
    this.wheelchairMode = false;

    this._bindButtons();
  }

  _bindButtons() {
    document.getElementById("accessToggle").addEventListener("click", () => this.toggleAccess());
    document.getElementById("routeBtn").addEventListener("click",    () => this.findRoute());
    document.getElementById("card-29").addEventListener("click",     () => this.selectDest(29));
    document.getElementById("card-30").addEventListener("click",     () => this.selectDest(30));
    document.getElementById("btn-floor0").addEventListener("click",  () => this.setFloor(0));
    document.getElementById("btn-floor1").addEventListener("click",  () => this.setFloor(1));
  }

  // ------------------------------------------------------------------
  // Kat değiştirme
  // ------------------------------------------------------------------

  setFloor(f) {
    this.renderer.setFloor(f);
    document.getElementById("btn-floor0").classList.toggle("active", f === 0);
    document.getElementById("btn-floor1").classList.toggle("active", f === 1);
    document.getElementById("floorBadge").innerHTML =
      `Görüntülenen: <span>${f === 0 ? "Zemin Kat" : "1. Kat"}</span>`;
  }

  // ------------------------------------------------------------------
  // Mağaza seçimi
  // ------------------------------------------------------------------

  selectDest(id) {
    this.selectedDest          = id;
    this.renderer.selectedDest = id;
    this.renderer.routePath    = null;

    [29, 30].forEach((i) =>
      document.getElementById("card-" + i).classList.toggle("selected", i === id)
    );

    document.getElementById("routeBtn").disabled = false;
    this._clearResult();
  }

  // ------------------------------------------------------------------
  // Erişilebilirlik toggle
  // ------------------------------------------------------------------

  toggleAccess() {
    this.wheelchairMode = !this.wheelchairMode;
    document.getElementById("accessToggle").classList.toggle("on", this.wheelchairMode);
    this.renderer.routePath = null;
    this._clearResult();
  }

  // ------------------------------------------------------------------
  // Rota hesaplama
  // ------------------------------------------------------------------

  findRoute() {
    this._clearResult();
    if (!this.selectedDest) return;

    const graph  = buildGraph(this.wheelchairMode);
    const result = dijkstra(graph, 1, this.selectedDest);

    if (!result) {
      document.getElementById("noRoute").classList.add("visible");
      return;
    }

    this.renderer.routePath = result.path;
    this._buildStepList(result);
    this.setFloor(1); // Hedef her zaman 1. katta
  }

  // ------------------------------------------------------------------
  // Adım listesi oluşturma
  // ------------------------------------------------------------------

  _buildStepList({ path, totalDist }) {
    const nm = {};
    NODES.forEach((n) => (nm[n.id] = n));

    // Ardışık kenarları türe göre grupla
    const transitions = [];
    let segDist  = 0;
    let segFloor = nm[path[0].id].floor;

    for (let i = 1; i < path.length; i++) {
      const t    = path[i].type;
      const node = nm[path[i].id];

      if (["elevator", "escalator", "stair"].includes(t)) {
        if (segDist > 0) transitions.push({ type: "walk", dist: segDist, floor: segFloor });
        transitions.push({ type: t, floor: nm[path[i - 1].id].floor, toFloor: node.floor });
        segDist  = 0;
        segFloor = node.floor;
      } else {
        const e = EDGES.find(
          (e) =>
            (e.from_id === path[i - 1].id && e.to_id === path[i].id) ||
            (e.to_id   === path[i - 1].id && e.from_id === path[i].id)
        );
        segDist += e?.distance || 0;
      }
    }

    if (segDist > 0) transitions.push({ type: "walk", dist: segDist, floor: segFloor });
    transitions.push({ type: "dest", dest: this.selectedDest === 29 ? "DeFacto" : "B-Oil" });

    // DOM'a yaz
    const el = document.getElementById("routeSteps");
    el.innerHTML = "";

    transitions.forEach((tr) => {
      const div  = document.createElement("div");
      div.className = "step " + tr.type;
      let text = "";
      let dist = "";

      if (tr.type === "walk") {
        text = "Düz yürüyün";
        dist = `${Math.round(tr.dist)} metre · Kat ${tr.floor}`;
      } else if (tr.type === "dest") {
        text = `${tr.dest} mağazasına ulaştınız!`;
      } else {
        const verb = tr.type === "elevator"  ? "Asansörle"
                   : tr.type === "escalator" ? "Yürüyen merdivenle"
                   :                           "Merdivenle";
        const dir  = tr.toFloor > tr.floor ? "çıkın" : "inin";
        text = `${verb} ${dir} (${tr.floor}. → ${tr.toFloor}. Kat)`;
      }

      div.innerHTML = `
        <div class="step-icon">${STEP_ICONS[tr.type]}</div>
        <div>
          <div>${text}</div>
          ${dist ? `<div class="step-dist">${dist}</div>` : ""}
        </div>`;
      el.appendChild(div);
    });

    // İstatistikler
    document.getElementById("statDist").textContent  = Math.round(totalDist);
    document.getElementById("statTime").textContent  = Math.max(1, Math.round(totalDist / 80));
    document.getElementById("statSteps").textContent = transitions.length;
    document.getElementById("routeResult").classList.add("visible");
  }

  _clearResult() {
    document.getElementById("routeResult").classList.remove("visible");
    document.getElementById("noRoute").classList.remove("visible");
  }
}
