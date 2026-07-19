'use server';
/**
 * @fileOverview Flow for parsing academic documents (mallas, schedules) into structured subjects.
 * High-precision extraction for Latin American university documents, including ACD/16 credits and complex schedules.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseAcademicFilesInputSchema = z.object({
  files: z.array(z.object({
    url: z.string().describe("Data URI of the image/pdf scan."),
    contentType: z.string().describe("MIME type.")
  })),
  type: z.enum(['malla', 'horario', 'both']).describe('The type of document being scanned.'),
});
export type ParseAcademicFilesInput = z.infer<typeof ParseAcademicFilesInputSchema>;

const SubjectOutputSchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  semester: z.number(),
  credits: z.number().describe("Academic credits (ACD/16 standard)."),
  professor: z.string().optional(),
  isBaseSubject: z.boolean().describe("Whether it's a foundational subject like Math, Physics, or core Programming."),
  schedule: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    room: z.string().optional()
  })).optional(),
});

const ParseAcademicFilesOutputSchema = z.object({
  subjects: z.array(SubjectOutputSchema),
  summary: z.string().describe("Summary of what was detected."),
  detectedSemester: z.number().optional(),
  totalCreditsDetected: z.number().optional(),
  quotaExceeded: z.boolean().optional().describe('Flag para cuota agotada.'),
});
export type ParseAcademicFilesOutput = z.infer<typeof ParseAcademicFilesOutputSchema>;

export async function parseAcademicFiles(input: ParseAcademicFilesInput): Promise<ParseAcademicFilesOutput> {
  return parseAcademicFilesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseAcademicFilesPrompt',
  input: { schema: ParseAcademicFilesInputSchema },
  output: { schema: ParseAcademicFilesOutputSchema },
  prompt: `Eres UniFlow Chronos, experto en análisis de documentos universitarios. 
Tu misión es procesar los archivos y generar una estructura de datos académicamente precisa para la gestión de carrera y horarios.

DOCUMENTOS:
{{#each files}}
{{media url=this.url}}
{{/each}}

INSTRUCCIONES CRÍTICAS:

1. MALLA CURRICULAR (CRÉDITOS ACD/16):
   - Identifica la columna "A.C.D." (Horas semestrales).
   - REGLA DE CRÉDITOS: Divide las horas ACD entre 16 para obtener los créditos. 
     (Ej: 48 -> 3 CR, 64 -> 4 CR, 80 -> 5 CR, 96 -> 6 CR).
   - Clasifica por semestre.

2. HORARIO (CRONOGRAMA):
   - Extrae CADA bloque de clase individual.
   - Días válidos: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.
   - Formato de tiempo: 24h (ej: "08:00", "14:30").
   - Identifica el Salón/Aula y el nombre del Docente.

3. CONSOLIDACIÓN:
   - Si una materia aparece tanto en la malla como en el horario, combina la información.
   - Asegúrate de que el campo "schedule" esté bien poblado si el documento es un horario.

Responde siempre en español profesional. Genera el JSON completo respetando el esquema de salida.`,
});

const parseAcademicFilesFlow = ai.defineFlow(
  {
    name: 'parseAcademicFilesFlow',
    inputSchema: ParseAcademicFilesInputSchema,
    outputSchema: ParseAcademicFilesOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return {
          subjects: [],
          summary: "El intérprete Chronos está temporalmente fuera de línea por exceso de demanda (Cuota de IA agotada). Por favor, intenta subir tus documentos de nuevo en unos momentos.",
          quotaExceeded: true
        };
      }
      throw error;
    }
  }
);
