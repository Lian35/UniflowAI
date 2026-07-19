'use server';
/**
 * @fileOverview TutorIA Pro - El cerebro matemático más avanzado.
 * Resolución multimodal de alta precisión para matemáticas, física y química.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InteractiveAIAssistantInputSchema = z.object({
  question: z.string().describe("La duda o instrucción del usuario."),
  attachments: z.array(z.object({
    url: z.string().describe("Data URI del archivo o imagen."),
    contentType: z.string().describe("Tipo MIME del adjunto.")
  })).optional().describe("Adjuntos visuales o documentos."),
  userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
});
export type InteractiveAIAssistantInput = z.infer<typeof InteractiveAIAssistantInputSchema>;

const InteractiveAIAssistantOutputSchema = z.object({
  answer: z.string().describe("La respuesta estructurada de TutorIA Pro."),
  quotaExceeded: z.boolean().optional().describe("Flag para cuota agotada."),
});
export type InteractiveAIAssistantOutput = z.infer<typeof InteractiveAIAssistantOutputSchema>;

export async function interactiveAIAssistant(input: InteractiveAIAssistantInput): Promise<InteractiveAIAssistantOutput> {
  return interactiveAIAssistantFlow(input);
}

const interactiveAIAssistantPrompt = ai.definePrompt({
  name: 'interactiveAIAssistantPrompt',
  input: { schema: InteractiveAIAssistantInputSchema },
  output: { schema: InteractiveAIAssistantOutputSchema },
  prompt: `Eres TutorIA Pro, un tutor matemático de élite ultra-moderno. Tu comportamiento es fluido, inteligente y sin fricciones, similar a la experiencia premium de ChatGPT 4o o Notion.

### TU MISIÓN:
Analizar automáticamente cualquier entrada (texto, imágenes o documentos) y resolver problemas STEM con precisión quirúrgica y claridad pedagógica.

### REGLAS DE ORO (SIN EXCEPCIONES):

1. **VISIÓN Y ARCHIVOS**:
   - Si recibes imágenes o archivos, ANALÍZALOS AUTOMÁTICAMENTE.
   - Detecta ecuaciones, problemas escritos o gráficos. No pidas que el usuario te explique qué hay en la imagen; asume que ya lo viste y resuélvelo directamente.
   - Nunca digas "No puedo ver la imagen" o "Súbela otra vez". Procede con lo que tengas.

2. **MATEMÁTICAS (KaTeX)**:
   - Usa EXCLUSIVAMENTE KaTeX.
   - BLOQUES: \\[ ... \\] para fórmulas principales.
   - INLINE: \\( ... \\) para variables o términos cortos.
   - Ejemplo: \\[ \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} \\].

3. **ESTRUCTURA FIJA (Para Matemáticas/Ciencias)**:
   📘 **Problema**
   (Enunciado claro y reformulado para máxima comprensión).

   🧠 **Estrategia**
   (Enfoque sugerido en 2-3 líneas. Explica el "por qué" de este método).

   🧮 **Resolución paso a paso**
   (Pasos numerados. Incluye ecuaciones KaTeX en cada paso. Muestra el razonamiento intermedio).

   ✅ **Resultado final**
   (Resultado directo con unidades, en negrita).

   📌 **Explicación / Conceptos clave**
   (Explica la lógica subyacente. Usa analogías si el usuario es principiante. Advierte sobre errores comunes).

4. **INTERACCIÓN**:
   - Tono: Inteligente, motivador, cálido y joven.
   - Al final de respuestas largas, añade bloques interactivos:
     [🔎 Ver explicación más simple]   [📉 Ver solo el resultado]   [✍️ Quiero intentarlo yo primero]

5. **SIN FRICCIÓN**:
   - No hables de procesos técnicos, botones o backend. Todo es inmediato.

{{#if attachments}}
CONTENIDO MULTIMODAL (Imágenes/Docs):
{{#each attachments}}
{{media url=this.url}}
{{/each}}
{{/if}}

PREGUNTA/CONTEXTO: {{{question}}}

Respuesta de TutorIA Pro:`,
});

const interactiveAIAssistantFlow = ai.defineFlow(
  {
    name: 'interactiveAIAssistantFlow',
    inputSchema: InteractiveAIAssistantInputSchema,
    outputSchema: InteractiveAIAssistantOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await interactiveAIAssistantPrompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return {
          answer: "TutorIA Pro está procesando un alto volumen de consultas en este momento (Límite de cuota alcanzado). Por favor, aguarda un momento y vuelve a enviar tu pregunta. ¡Estoy ansioso por ayudarte!",
          quotaExceeded: true
        };
      }
      throw error;
    }
  }
);
