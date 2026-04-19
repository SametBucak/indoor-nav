# 🗺️ Indoor Navigation Demo

QGIS'te hazırlanan AVM kat planları üzerinde çalışan, saf HTML/CSS/JS ile yazılmış indoor navigasyon demosu.

## Özellikler

- 🏢 Çok katlı kat planı görüntüleme (Zemin Kat / 1. Kat)
- 🔍 Pan & zoom (mouse wheel, sürükleme, pinch-to-zoom)
- 🧭 Dijkstra algoritması ile en kısa rota hesaplama
- ♿ Tekerlekli sandalye modu (sadece asansör)
- 📋 Adım adım yön tarifi
- 🗺️ Georeferenced kat planı (EPSG:3857 → WGS84)

## Dosya Yapısı

```
indoor-nav/
├── index.html          # Ana HTML şablonu
├── css/
│   └── style.css       # Tüm stiller
├── js/
│   ├── data.js         # Node'lar, kenarlar, coğrafi sınırlar
│   ├── graph.js        # Graf inşası + Dijkstra algoritması
│   ├── renderer.js     # Canvas çizim motoru
│   ├── ui.js           # Sidebar etkileşimleri
│   └── main.js         # Uygulama başlatıcı
├── assets/
│   ├── floor-0.png     # Zemin kat planı
│   ├── floor-1.png     # 1. kat planı
│   ├── nodes.geojson   # Node verisi (QGIS çıktısı)
│   └── edges.geojson   # Kenar verisi (QGIS çıktısı)
│   └── floor-1.png     # 1. kat planı
└── README.md
```

## Kurulum & Çalıştırma

Projeyi yerel sunucu üzerinden açın (tarayıcı güvenlik kısıtlamaları nedeniyle dosyaları doğrudan açmak çalışmaz):

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .
```

Ardından tarayıcıda `http://localhost:8080` adresine gidin.

## Veri Formatı

### Node özellikleri (`js/data.js`)

| Alan    | Tip    | Açıklama                                                              |
|---------|--------|-----------------------------------------------------------------------|
| `id`    | number | Benzersiz tanımlayıcı                                                 |
| `name`  | string | Görüntülenen isim                                                     |
| `floor` | number | Kat numarası (0 = zemin)                                              |
| `type`  | string | `entrance`, `elevator`, `escalator`, `stair`, `store_entrance`, `node` |
| `lat`   | number | WGS84 enlem                                                           |
| `lng`   | number | WGS84 boylam                                                          |

### Kenar özellikleri

| Alan         | Tip    | Açıklama                                          |
|--------------|--------|---------------------------------------------------|
| `from_id`    | number | Başlangıç node id'si                              |
| `to_id`      | number | Bitiş node id'si                                  |
| `distance`   | number | Metre cinsinden mesafe                            |
| `accesstype` | string | `walk`, `elevator`, `escalator`, `stair`          |

## Yeni Kat / Mağaza Ekleme

1. **Kat planı görseli:** `assets/` klasörüne PNG olarak ekleyin.
2. **Coğrafi sınırlar:** `js/data.js` içindeki `GEO_BOUNDS` nesnesine yeni katı ekleyin.
3. **Node'lar & kenarlar:** QGIS'ten dışa aktarılan GeoJSON'ı WGS84'e dönüştürüp `NODES` ve `EDGES` dizilerine ekleyin.
4. **Görsel yükleme:** `js/main.js` içindeki `FLOOR_IMAGES` dizisine yeni görsel yolunu ekleyin.
5. **Kat butonu:** `index.html` içine yeni bir `.floor-btn` ekleyin.

## Teknoloji

- Saf HTML / CSS / JavaScript (sıfır bağımlılık)
- Canvas 2D API (harita çizimi)
- Dijkstra algoritması (en kısa yol)
- QGIS + EPSG:3857 → WGS84 koordinat dönüşümü
