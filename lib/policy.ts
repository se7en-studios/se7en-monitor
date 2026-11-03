import type { OperationalPolicy } from "@/types/monitor";

export const POLICY_COLLECTION = "settings";
export const POLICY_ID = "operational-policy";

type PolicyKey = Exclude<keyof OperationalPolicy, "id" | "updated_at" | "updated_by">;

/** Lo que la ordenanza deja a definir por el Municipio y el sistema debe poder responder. */
export const POLICY_FIELDS: { key: PolicyKey; label: string; placeholder: string }[] = [
  {
    key: "operator_organism",
    label: "Organismo que opera el sistema",
    placeholder: "ej: Dirección de Seguridad Urbana",
  },
  {
    key: "data_controller",
    label: "Responsable del tratamiento de las imágenes",
    placeholder: "ej: Secretaría de Gobierno",
  },
  {
    key: "retention",
    label: "Conservación de grabaciones",
    placeholder: "ej: No se almacenan. Solo transmisión en vivo.",
  },
  {
    key: "supervision_body",
    label: "Supervisión y control",
    placeholder: "ej: Comisión del Concejo Deliberante",
  },
  {
    key: "education_coordination",
    label: "Coordinación con autoridades educativas",
    placeholder: "ej: Supervisión escolar zonal",
  },
  {
    key: "security_coordination",
    label: "Coordinación con seguridad",
    placeholder: "ej: Comisaría de Catriel",
  },
];

export const emptyPolicy = (): OperationalPolicy => ({
  id: POLICY_ID,
  operator_organism: "",
  data_controller: "",
  retention: "",
  supervision_body: "",
  education_coordination: "",
  security_coordination: "",
  updated_at: "",
  updated_by: "",
});
