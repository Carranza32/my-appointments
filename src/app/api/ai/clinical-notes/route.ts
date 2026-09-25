import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Verificación de Autenticación
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Extraer cuerpo de la solicitud
    const { notes } = await req.json();
    if (!notes || typeof notes !== "string" || notes.trim().length < 5) {
      return NextResponse.json(
        { error: "Las notas rápidas deben tener al menos 5 caracteres." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "La API Key de Gemini no está configurada en el servidor." },
        { status: 500 }
      );
    }

    // 3. Prompt de estructuración en SOAP
    const prompt = `Actúa como un asistente de redacción clínica profesional para un psicólogo.
Toma el siguiente texto informal, que contiene las notas o viñetas desestructuradas que el psicólogo tomó durante una sesión de terapia con un paciente, y estructúralas en una nota clínica formal en formato SOAP (Subjetivo, Objetivo, Análisis, Plan).

Reglas estrictas:
- Redacta de forma profesional, utilizando terminología clínica y psicológica adecuada, con tono ético, profesional, neutro y empático.
- Mantén el idioma en español.
- NO inventes datos ni diagnostiques nada que no esté directamente expresado o implícito en las notas originales del terapeuta.
- Si faltan datos en alguna sección (como la parte Objetiva o el Plan), descríbelo de manera formal o redacta indicaciones generales alineadas con lo provisto.
- Estructura el resultado utilizando Markdown claro con negritas para los títulos principales (ej. **Subjetivo (S)**, **Objetivo (O)**, **Análisis (A)**, **Plan (P)**) y viñetas para los puntos individuales.

Notas desestructuradas del terapeuta:
"""
${notes.trim()}
"""`;

    // 4. Consumir API de Google Gemini (1.5 Flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("[Gemini API Error]:", errData);
      return NextResponse.json(
        { error: "Error en la respuesta de la API de Gemini." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: "No se pudo generar el texto estructurado." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, formattedNote: generatedText });
  } catch (error: any) {
    console.error("[Clinical Notes AI Error]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
