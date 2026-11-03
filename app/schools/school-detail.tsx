"use client";

import Link from "next/link";
import { Cctv, Video } from "lucide-react";
import { patchDoc } from "@/lib/firebase/data";
import { cameraCoverage } from "@/lib/geo";
import { StatusBadge } from "@/components/status-badge";
import { describeError, useToast } from "@/components/toast";
import {
  Card,
  EmptyState,
  btnGhost,
  btnSecondary,
  input,
} from "@/components/ui";
import type { Camera, School, SchoolManagement } from "@/types/monitor";

interface SchoolDetailProps {
  school: School;
  cameras: Camera[];
  canEdit: boolean;
}

function coverageSummary(school: School, cameras: Camera[]): string {
  if (!cameras.length)
    return "Sin cámaras instaladas: esta escuela todavía no tiene cobertura.";
  const coverage = cameras.map((c) => cameraCoverage(c, school));
  const inside = coverage.filter((c) => c === "dentro").length;
  const outside = coverage.filter((c) => c === "fuera").length;
  const unlocated = coverage.filter((c) => c === "sin_ubicacion").length;
  return (
    `${inside} de ${cameras.length} cámaras verificadas dentro del radio` +
    (outside ? ` · ${outside} fuera` : "") +
    (unlocated ? ` · ${unlocated} sin ubicación` : "")
  );
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

/** Ficha de la escuela elegida: datos, radio protegido y sus cámaras. */
export function SchoolDetail({ school, cameras, canEdit }: SchoolDetailProps) {
  const toast = useToast();

  const onManagement = (value: SchoolManagement) =>
    patchDoc("schools", school.id, { management: value }).catch((err) =>
      toast.error(describeError(err, "No se pudo guardar la gestión.")),
    );

  return (
    <Card
      title="Ficha institucional"
      action={<StatusBadge status={school.status} size="sm" />}
      className="lg:sticky lg:top-24"
    >
      <div className="space-y-5 p-4">
        <div>
          <h2 className="adm-title text-[17px] leading-tight text-foreground">
            {school.name}
          </h2>
          <p className="mt-1 font-mono text-[12px] text-muted">
            {school.code} · Nivel {school.educational_level}
          </p>
        </div>

        <label className="block">
          <span className="adm-label">Gestión</span>
          <select
            value={school.management ?? ""}
            disabled={!canEdit}
            onChange={(e) => onManagement(e.target.value as SchoolManagement)}
            className={`${input} mt-1 disabled:opacity-70`}
          >
            {!school.management && <option value="">Sin dato</option>}
            <option value="estatal">Estatal</option>
            <option value="privada">Privada</option>
          </select>
        </label>

        <div className="space-y-3 border-t border-[var(--line)] pt-4">
          <Field label="Dirección y barrio">
            <p>{school.address}</p>
            <p className="text-[12px] text-muted">
              {school.neighborhood}, {school.city}
            </p>
          </Field>
          <Field label="Responsable institucional">
            {school.principal_name || "Sin dato"}
          </Field>
          <Field label="Contacto">
            <p className="font-mono">{school.phone || "Sin teléfono"}</p>
            <p className="text-[12px] break-all text-muted">{school.email}</p>
          </Field>
        </div>

        <div className="rounded-lg border border-accent/20 bg-accent-soft p-3">
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <span className="font-medium text-accent">
              Corredor Escolar Cuidado
            </span>
            <span className="adm-num text-[18px] text-accent">
              {school.perimeter_radius_meters} m
            </span>
          </div>
          <p className="mt-1 text-[12px] text-foreground/80">
            {coverageSummary(school, cameras)}
          </p>
        </div>

        <div className="border-t border-[var(--line)] pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="adm-label">Cámaras asociadas ({cameras.length})</p>
            {cameras.length > 0 && (
              <Link
                href={`/monitor/live?school=${school.id}`}
                className={`${btnGhost} px-2.5 py-1 text-[12px]`}
              >
                <Video className="h-3.5 w-3.5" />
                Ver en vivo
              </Link>
            )}
          </div>

          {cameras.length === 0 ? (
            <EmptyState
              icon={<Cctv className="h-5 w-5" />}
              title="Sin cámaras"
              action={
                canEdit ? (
                  <Link href="/monitor/cameras" className={btnSecondary}>
                    Agregar cámara
                  </Link>
                ) : undefined
              }
            >
              Esta escuela todavía no tiene cámaras en su corredor.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {cameras.map((cam) => (
                <li
                  key={cam.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--line)] bg-[var(--well)] p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Cctv className="h-3.5 w-3.5 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-foreground">
                        {cam.name}
                      </p>
                      <p className="font-mono text-[11px] text-muted">
                        {cam.identifier}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={cam.status} size="sm" showDot={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
