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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Catriel, Río Negro
    const map = L.map(mapContainerRef.current, {
      center: [-37.8812, -67.7955],
      zoom: 15,
      zoomControl: false,
    });

    // Dark Matter tiles for institutional GIS look
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> | Municipio de Catriel',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    circlesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers (Circles & Markers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !circlesLayerRef.current || !markersLayerRef.current) return;

    circlesLayerRef.current.clearLayers();
    markersLayerRef.current.clearLayers();

    // 1. Draw 200m circular perimeters
    if (showRadius) {
      schools.forEach((sch) => {
        const circle = L.circle([sch.lat, sch.lng], {
          radius: sch.perimeter_radius_meters, // Exactly 200m
          color: sch.status === "operativo" ? "#38bdf8" : "#f59e0b",
          weight: 2,
          dashArray: "6, 6",
          fillColor: "#2563eb",
          fillOpacity: 0.14,
        });

        circle.bindTooltip(
          `<strong>${sch.name}</strong><br/>Radio protegido: ${sch.perimeter_radius_meters} metros`,
          { className: "leaflet-dark-tooltip", sticky: true }
        );

        circlesLayerRef.current?.addLayer(circle);
      });
    }

    // 2. Draw School Pins
    schools.forEach((sch) => {
      const isSelected = selectedEntity && "code" in selectedEntity && selectedEntity.id === sch.id;

      const schoolIcon = L.divIcon({
        className: "custom-school-icon",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="h-9 w-9 rounded-full ${
              isSelected ? "bg-blue-500 ring-4 ring-blue-400/50 scale-110" : "bg-blue-600"
            } text-white flex items-center justify-center shadow-lg border-2 border-white transition-all cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/></svg>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-[#0c101a] text-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/20 shadow">
              ${sch.code}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([sch.lat, sch.lng], { icon: schoolIcon });
      marker.on("click", () => {
        onSelectEntity(sch);
        map.panTo([sch.lat, sch.lng], { animate: true });
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // 3. Draw Camera Pins
    if (showCameras) {
      cameras.forEach((cam, index) => {
        // Place cameras geographically spaced around their associated school
        const targetSchool = schools.find((s) => s.id === cam.school_id) || schools[0];
        const offsetLat = ((index % 3) - 1) * 0.0011;
        const offsetLng = (((index + 1) % 3) - 1) * 0.0013;
        const camLat = targetSchool.lat + offsetLat;
        const camLng = targetSchool.lng + offsetLng;

        const isMobile = cam.device_type === "mobile_webrtc";
        const color =
          cam.status === "online"
            ? "bg-emerald-500"
            : cam.status === "alerta"
            ? "bg-amber-500"
            : "bg-rose-500";

        const camIcon = L.divIcon({
          className: "custom-cam-icon",
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="h-6 w-6 rounded-full ${color} ${
            isMobile ? "animate-pulse ring-2 ring-cyan-400" : ""
          } text-black font-bold flex items-center justify-center shadow-md border border-black/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.75 12h3.25a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3.25"/><path d="m10 6 2-2 2 2"/><path d="M12 4v8"/></svg>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const camMarker = L.marker([camLat, camLng], { icon: camIcon });
        camMarker.on("click", () => {
          onSelectEntity(cam);
        });

        markersLayerRef.current?.addLayer(camMarker);
      });
    }
  }, [schools, cameras, showRadius, showCameras, selectedEntity, onSelectEntity]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full w-full rounded-2xl overflow-hidden"
      style={{ background: "#080c14" }}
    />
  );
}
