"use client";

import Link from "next/link";
import { MapPin, School, Video } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Card, EmptyState, btnPrimary, btnSecondary } from "@/components/ui";
import type { Camera, School as SchoolType } from "@/types/monitor";

interface MapPanelProps {
  entity: SchoolType | Camera | null;
  cameras: Camera[];
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="adm-label">{label}</p>
      <div className="mt-1 text-[13px] text-foreground">{children}</div>
    </div>
  );
}

/** Panel al costado del mapa: la escuela o la cámara elegida. */
export function MapPanel({ entity, cameras }: MapPanelProps) {
  if (!entity) {
    return (
      <Card title="Detalle" className="lg:col-span-1">
        <div className="p-4">
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="Nada elegido"
          >
            Tocá un pin del mapa para ver la escuela o la cámara.
          </EmptyState>
        </div>
      </Card>
    );
  }

  const isSchool = "code" in entity;
  return (
    <Card
      title={isSchool ? "Escuela" : "Cámara"}
      action={<StatusBadge status={entity.status} size="sm" />}
      className="lg:col-span-1"
    >
      <div className="space-y-4 p-4">
        <div>
          <h2 className="adm-title text-[17px] leading-tight text-foreground">
            {entity.name}
          </h2>
          <p className="mt-1 text-[12px] text-muted">
            {isSchool
              ? `${entity.address}, ${entity.neighborhood}`
              : entity.location_detail}
          </p>
        </div>

        {isSchool ? (
          <>
            <div className="rounded-lg border border-accent/20 bg-accent-soft p-3">
              <p className="adm-label text-accent">Corredor Escolar Cuidado</p>
              <p className="adm-num mt-1 text-[24px] leading-none text-foreground">
                {entity.perimeter_radius_meters} m
              </p>
              <p className="mt-1 text-[12px] text-foreground/80">
                de radio protegido alrededor del establecimiento.
              </p>
            </div>
            <Field label="Código">
              <span className="font-mono">{entity.code}</span>
            </Field>
            <Field label="Cámaras asociadas">
              <span className="font-mono">
                {cameras.filter((c) => c.school_id === entity.id).length}
              </span>
            </Field>
            <Field label="Responsable institucional">
              {entity.principal_name || "Sin dato"}
            </Field>
            <Link
              href={`/schools?school=${entity.id}`}
              className={`${btnSecondary} w-full`}
            >
              <School className="h-4 w-4" />
              Ver ficha de la escuela
            </Link>
          </>
        ) : (
          <>
            <Field label="Identificador">
              <span className="font-mono text-accent">{entity.identifier}</span>
            </Field>
            <Field label="Transmisión">
              <span className="font-mono">
                {entity.stream_type.toUpperCase()} · {entity.resolution}
              </span>
            </Field>
            <Field label="Establecimiento">{entity.school_name}</Field>
            <Link
              href={`/monitor/live?focus=${entity.id}`}
              className={`${btnPrimary} w-full`}
            >
              <Video className="h-4 w-4" />
              Abrir en vivo
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
