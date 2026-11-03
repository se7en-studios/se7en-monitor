"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { School, Camera } from "@/types/monitor";

interface InteractiveMapProps {
  schools: School[];
  cameras: Camera[];
  selectedEntity: School | Camera | null;
  onSelectEntity: (entity: School | Camera) => void;
  showRadius: boolean;
  showCameras: boolean;
}

const CATRIEL: L.LatLngTuple = [-37.8812, -67.7955];

// Íconos (lucide) dentro de los pines. Cada estado tiene su forma (en globals.css) y su glifo.
const SVG = (path: string, size = 13) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const GLYPH: Record<Camera["status"], string> = {
  online: SVG('<path d="M20 6 9 17l-5-5"/>'),
  alerta: SVG('<path d="M12 8v5"/><path d="M12 16.5h.01"/>'),
  mantenimiento: SVG(
    '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    12,
  ),
  offline: SVG('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
};
const STATUS_LABEL: Record<Camera["status"], string> = {
  online: "en línea",
  alerta: "en alerta",
  mantenimiento: "en mantenimiento",
  offline: "sin señal",
};
const SCHOOL_GLYPH = SVG(
  '<path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 5v17"/><path d="M6 5v17"/>',
  17,
);

const escapeHtml = (s: string) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ] ?? ch,
  );

/** Los colores de Leaflet (círculos) salen de los tokens de globals.css. */
const token = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function schoolIcon(school: School, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin map-pin--school${selected ? " map-pin--selected" : ""}" style="width:36px;height:36px">
      <div class="map-pin__body">${SCHOOL_GLYPH}</div>
      <div class="map-pin__code">${escapeHtml(school.code)}</div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function cameraIcon(cam: Camera, selected: boolean) {
  const mobile = cam.device_type === "mobile_webrtc";
  return L.divIcon({
    className: "",
    html: `<div class="map-pin map-pin--${cam.status}${selected ? " map-pin--selected" : ""}" style="width:24px;height:24px">
      <div class="map-pin__body">${GLYPH[cam.status] ?? GLYPH.offline}</div>
      ${mobile ? '<span class="map-pin__mobile"></span>' : ""}
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function InteractiveMap({
  schools,
  cameras,
  selectedEntity,
  onSelectEntity,
  showRadius,
  showCameras,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CATRIEL,
      zoom: 15,
      zoomControl: false,
    });
    // Mosaicos de OpenStreetMap, oscurecidos con CSS (.map-tiles en globals.css). Los de CARTO
    // pasaron a exigir clave de API y mostraban una marca de agua. Para mucho tráfico, usar un
    // proveedor con clave propia (MapTiler, Stadia) y cambiar solo esta URL.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "map-tiles",
    }).addTo(map);
    L.control
      .zoom({
        position: "topright",
        zoomInTitle: "Acercar",
        zoomOutTitle: "Alejar",
      })
      .addTo(map);

    circlesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // El contenedor cambia de tamaño con la barra lateral y el cajón: Leaflet tiene que enterarse.
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(mapContainerRef.current);

    return () => {
      resize.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const circles = circlesLayerRef.current;
    const markers = markersLayerRef.current;
    if (!map || !circles || !markers) return;

    circles.clearLayers();
    markers.clearLayers();
    const accent = token("--accent");
    const warn = token("--warn");

    if (showRadius) {
      schools.forEach((sch) => {
        L.circle([sch.lat, sch.lng], {
          radius: sch.perimeter_radius_meters,
          color: sch.status === "operativo" ? accent : warn,
          weight: 1.5,
          dashArray: "6, 6",
          fillColor: accent,
          fillOpacity: 0.1,
        })
          .bindTooltip(
            `<strong>${escapeHtml(sch.name)}</strong><br/>Radio protegido: ${Number(sch.perimeter_radius_meters) || 0} m`,
            { className: "leaflet-dark-tooltip", sticky: true },
          )
          .addTo(circles);
      });
    }

    schools.forEach((sch) => {
      const selected =
        !!selectedEntity &&
        "code" in selectedEntity &&
        selectedEntity.id === sch.id;
      L.marker([sch.lat, sch.lng], {
        icon: schoolIcon(sch, selected),
        title: sch.name,
        alt: `Escuela ${sch.name}`,
        keyboard: true,
      })
        .on("click", () => {
          onSelectEntity(sch);
          map.panTo([sch.lat, sch.lng], { animate: true });
        })
        .addTo(markers);
    });

    if (showCameras) {
      cameras.forEach((cam, index) => {
        const school =
          schools.find((s) => s.id === cam.school_id) ?? schools[0];
        if (cam.lat == null && !school) return;
        // Posición real si la cámara la tiene; en datos viejos, repartida alrededor de la escuela.
        const lat = cam.lat ?? school.lat + ((index % 3) - 1) * 0.0011;
        const lng = cam.lng ?? school.lng + (((index + 1) % 3) - 1) * 0.0013;
        const selected =
          !!selectedEntity &&
          !("code" in selectedEntity) &&
          selectedEntity.id === cam.id;
        L.marker([lat, lng], {
          icon: cameraIcon(cam, selected),
          title: `${cam.name} · ${STATUS_LABEL[cam.status] ?? cam.status}`,
          alt: `Cámara ${cam.name}, ${STATUS_LABEL[cam.status] ?? cam.status}`,
          keyboard: true,
        })
          .on("click", () => onSelectEntity(cam))
          .addTo(markers);
      });
    }
  }, [
    schools,
    cameras,
    showRadius,
    showCameras,
    selectedEntity,
    onSelectEntity,
  ]);

  return <div ref={mapContainerRef} className="h-full w-full bg-background" />;
}
