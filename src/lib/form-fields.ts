import { Rubro } from "@prisma/client";

export type FormFieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  required?: boolean;
  options?: string[];
};

export function parseFormFieldsFromJson(value: unknown): FormFieldDef[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (f): f is FormFieldDef =>
      typeof f === "object" &&
      f !== null &&
      "name" in f &&
      "label" in f &&
      "type" in f,
  ) as FormFieldDef[];
}

export function getDefaultFormFields(rubro: Rubro): FormFieldDef[] {
  switch (rubro) {
    case Rubro.SALUD:
      return [
        {
          name: "motivo",
          label: "Motivo de la consulta",
          type: "textarea",
          required: true,
        },
      ];
    case Rubro.BELLEZA:
      return [
        {
          name: "tipoCorte",
          label: "Tipo de corte o servicio",
          type: "select",
          required: true,
          options: ["Corte", "Color", "Peinado", "Otro"],
        },
      ];
    case Rubro.CONSULTORIA:
      return [
        {
          name: "tema",
          label: "Tema de la sesión",
          type: "text",
          required: true,
        },
      ];
    default:
      return [];
  }
}
