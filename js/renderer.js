

const TYPE_COLOR = {
  entrance:      "#4f8cff",
  elevator:      "#ffd166",
  escalator:     "#a29bfe",
  stair:         "#fd79a8",
  store_entrance:"#55efc4",
  node:          "#4a5270",
};

const TYPE_LABEL = {
  entrance:      "Giriş",
  elevator:      "Asansör",
  escalator:     "Yürüyen Merdiven",
  stair:         "Merdiven",
  store_entrance:"Mağaza Girişi",
  node:          "Bağlantı Noktası",
};

class Renderer {
  
  constructor(canvas, images, tooltip) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext("2d");
    this.images  = images;
    this.tooltip = tooltip;

    
    this.W = 0;
    this.H = 0;
    this.scale  = 1;
    this.offX   = 0;
    this.offY   = 0;
    this.floor  = 0;

    
    this.routePath    = null;
    this.selectedDest = null;

    this._dragging  = false;
    this._dragStart = null;
    this._viewStart = null;
    this._lastTouchDist = null;

    this._bindEvents();
    this._loop();
  }

  
  geoToCanvas(lat, lng) {
    const b   = GEO_BOUNDS[this.floor];
    const img = this.images[this.floor];
    const tx  = (lng - b.minLng) / (b.maxLng - b.minLng);
    const ty  = 1 - (lat - b.minLat) / (b.maxLat - b.minLat);
    return [
      this.offX + tx * img.naturalWidth  * this.scale,
      this.offY + ty * img.naturalHeight * this.scale,
    ];
  }

  
  canvasToGeo(cx, cy) {
    const b   = GEO_BOUNDS[this.floor];
    const img = this.images[this.floor];
    const tx  = (cx - this.offX) / (img.naturalWidth  * this.scale);
    const ty  = (cy - this.offY) / (img.naturalHeight * this.scale);
    return {
      lat: b.minLat + (1 - ty) * (b.maxLat - b.minLat),
      lng: b.minLng + tx       * (b.maxLng - b.minLng),
    };
  }

  
  fitFloor() {
    const img = this.images[this.floor];
    if (!img.naturalWidth) return;
    const pad = 30;
    const sx  = (this.W - pad * 2) / img.naturalWidth;
    const sy  = (this.H - pad * 2) / img.naturalHeight;
    this.scale = Math.min(sx, sy);
    this.offX  = (this.W - img.naturalWidth  * this.scale) / 2;
    this.offY  = (this.H - img.naturalHeight * this.scale) / 2;
  }

  
  resize() {
    const wrap = this.canvas.parentElement;
    this.W = this.canvas.width  = wrap.clientWidth;
    this.H = this.canvas.height = wrap.clientHeight;
    this.fitFloor();
  }

  setFloor(f) {
    this.floor = f;
    this.fitFloor();
  }

  

  _loop() {
    this._draw();
    requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const img = this.images[this.floor];
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, this.offX, this.offY, img.naturalWidth * this.scale, img.naturalHeight * this.scale);
    }

    this._drawEdges();
    this._drawRoute();
    this._drawNodes();
  }

  _drawEdges() {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.lineWidth   = 1.5;

    EDGES.forEach((e) => {
      if (e.from_id === e.to_id) return;
      const a = nodeById(e.from_id);
      const b = nodeById(e.to_id);
      if (!a || !b) return;
      if (a.floor !== this.floor && b.floor !== this.floor) return;

      const [ax, ay] = this.geoToCanvas(a.lat, a.lng);
      const [bx, by] = this.geoToCanvas(b.lat, b.lng);
      ctx.strokeStyle = TYPE_COLOR[a.type] || "#888";
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    });

    ctx.restore();
  }

  _drawRoute() {
    if (!this.routePath || this.routePath.length < 2) return;
    const { ctx } = this;
    const nm = {};
    NODES.forEach((n) => (nm[n.id] = n));

    for (let i = 0; i < this.routePath.length - 1; i++) {
      const a = nm[this.routePath[i].id];
      const b = nm[this.routePath[i + 1].id];
      const t = this.routePath[i + 1].type;
      if (a.floor !== this.floor && b.floor !== this.floor) continue;

      const [ax, ay] = this.geoToCanvas(a.lat, a.lng);
      const [bx, by] = this.geoToCanvas(b.lat, b.lng);
      const color = t === "elevator"  ? "#ffd166"
                  : t === "escalator" ? "#a29bfe"
                  : t === "stair"     ? "#fd79a8"
                  :                     "#4f8cff";

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth   = 4;
      ctx.lineCap     = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur  = 10;
      ctx.setLineDash(["elevator", "escalator", "stair"].includes(t) ? [7, 5] : []);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawNodes() {
    const { ctx } = this;
    const now = Date.now();

    NODES.forEach((n) => {
      if (n.floor !== this.floor) return;
      const [cx, cy] = this.geoToCanvas(n.lat, n.lng);
      const isSpecial = ["entrance", "store_entrance"].includes(n.type);
      const r     = isSpecial ? 10 : 6;
      const color = TYPE_COLOR[n.type] || "#888";

      
      if (this.selectedDest === n.id) {
        const t = (now % 1400) / 1400;
        ctx.save();
        ctx.strokeStyle  = color;
        ctx.lineWidth    = 2;
        ctx.globalAlpha  = 0.6 * (1 - t);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4 + t * 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur  = 8;
      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth   = 1.5;
      ctx.shadowBlur  = 0;
      ctx.stroke();
      ctx.restore();
    });

    
    const start = nodeById(1);
    if (start && start.floor === this.floor) {
      const [sx, sy] = this.geoToCanvas(start.lat, start.lng);
      ctx.save();
      ctx.fillStyle   = "#4f8cff";
      ctx.shadowColor = "#4f8cff";
      ctx.shadowBlur  = 14;
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 0;
      ctx.stroke();
      ctx.restore();
    }
  }

  

  _bindEvents() {
    const c = this.canvas;

    
    c.addEventListener("mousedown", (e) => {
      this._dragging  = true;
      this._dragStart = [e.clientX, e.clientY];
      this._viewStart = [this.offX, this.offY];
    });
    window.addEventListener("mouseup", () => (this._dragging = false));
    c.addEventListener("mousemove", (e) => {
      if (this._dragging) {
        this.offX = this._viewStart[0] + (e.clientX - this._dragStart[0]);
        this.offY = this._viewStart[1] + (e.clientY - this._dragStart[1]);
      }
      this._updateTooltip(e);
    });
    c.addEventListener("mouseleave", () => {
      this._dragging = false;
      this.tooltip.style.display = "none";
    });

    
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect   = c.getBoundingClientRect();
      const mx     = e.clientX - rect.left;
      const my     = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const ns     = Math.max(0.4, Math.min(10, this.scale * factor));
      this.offX    = mx - (mx - this.offX) * (ns / this.scale);
      this.offY    = my - (my - this.offY) * (ns / this.scale);
      this.scale   = ns;
    }, { passive: false });

    
    c.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this._dragging  = true;
        this._dragStart = [e.touches[0].clientX, e.touches[0].clientY];
        this._viewStart = [this.offX, this.offY];
      }
    });
    c.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && this._dragging) {
        this.offX = this._viewStart[0] + (e.touches[0].clientX - this._dragStart[0]);
        this.offY = this._viewStart[1] + (e.touches[0].clientY - this._dragStart[1]);
      } else if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (this._lastTouchDist) {
          this.scale = Math.max(0.4, Math.min(10, this.scale * (d / this._lastTouchDist)));
        }
        this._lastTouchDist = d;
      }
    }, { passive: false });
    c.addEventListener("touchend", () => {
      this._dragging      = false;
      this._lastTouchDist = null;
    });
  }

  _updateTooltip(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    let hovered = null;

    NODES.forEach((n) => {
      if (n.floor !== this.floor) return;
      const [cx, cy] = this.geoToCanvas(n.lat, n.lng);
      if (Math.hypot(mx - cx, my - cy) < 14) hovered = n;
    });

    if (hovered) {
      this.tooltip.style.display = "block";
      this.tooltip.style.left    = mx + 14 + "px";
      this.tooltip.style.top     = my - 10 + "px";
      this.tooltip.innerHTML     = `
        <b style="color:${TYPE_COLOR[hovered.type]}">${hovered.name}</b><br>
        <span style="color:#6b7394">${TYPE_LABEL[hovered.type]} · Kat ${hovered.floor}</span>
      `;
    } else {
      this.tooltip.style.display = "none";
    }
  }
}
