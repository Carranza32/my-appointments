import { getRubroConfig } from "./rubros";

export type FormFieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "boolean" | "number" | "email" | "tel";
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

export function getDefaultFormFields(rubro: string): FormFieldDef[] {
  const config = getRubroConfig(rubro);
  return config.defaultFormFields;
}
