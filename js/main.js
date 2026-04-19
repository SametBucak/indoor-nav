/**
 * main.js
 * Uygulama başlatıcısı.
 * GeoJSON verilerini ve görselleri paralel yükler,
 * ardından Renderer ve UI'ı oluşturur.
 */

(async function () {
  const canvas  = document.getElementById("c");
  const tooltip = document.getElementById("tooltip");

  // GeoJSON verisini ve kat planı görsellerini paralel yükle
  const FLOOR_IMAGES = ["assets/floor-0.png", "assets/floor-1.png"];

  const imagePromises = FLOOR_IMAGES.map(
    (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => console.error("Görsel yüklenemedi:", src);
        img.src = src;
      })
  );

  try {
    // Veri + görseller hazır olunca başlat
    const [images] = await Promise.all([
      Promise.all(imagePromises),
      loadData(), // data.js — NODES ve EDGES'i doldurur
    ]);

    const renderer = new Renderer(canvas, images, tooltip);
    const ui       = new UI(renderer);

    renderer.resize();
    window.addEventListener("resize", () => renderer.resize());

    ui.setFloor(0);

  } catch (err) {
    console.error("Uygulama başlatılamadı:", err);
    document.body.innerHTML = `
      <div style="padding:40px;color:#ff6b4a;font-family:sans-serif">
        <b>Hata:</b> ${err.message}<br><br>
        Projeyi bir HTTP sunucusu üzerinden açtığınızdan emin olun:<br>
        <code>python3 -m http.server 8080</code>
      </div>`;
  }
})();
