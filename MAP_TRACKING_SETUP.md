# 🌙 Midnight Monk — Live Order Tracking Setup (Leaflet + OpenStreetMap)

Midnight Monk uses **Leaflet** and **OpenStreetMap (OSM)** for real-time customer order tracking.

---

## 🚀 Key Advantages
- **Zero API Keys**: No Google Cloud account, billing account, or credit card required.
- **Open-Source & Free**: Powered by OpenStreetMap tile servers with HTTPS.
- **Custom Branded Markers**: Inline SVG markers for Kitchen (📍), Delivery Partner (🛵), and Customer (📍) that avoid missing asset path 404s.
- **Dynamic Routing**: Renders driving paths using OSRM with automatic fallback to direct route polylines.
- **Smooth Interpolation**: Fluid rider movement using `requestAnimationFrame` and cubic easing.
- **Automatic Fallback**: If network or coordinates fail, seamlessly displays an interactive vector trip simulator.

---

## 🗺️ Tile Layer & Attribution
- **Tile URL**: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Attribution**: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`

---

## 🛠️ Configuration
No environment variables are needed for mapping! The frontend uses standard OpenStreetMap tiles out of the box.

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```
