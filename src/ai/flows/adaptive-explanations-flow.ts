'use server';
/**
 * @fileOverview This file implements a Genkit flow for providing adaptive explanations
 * and academic improvement suggestions based on a user's understanding level and academic context.
 *
 * - explainAndSuggest: A function that handles the adaptive explanation and suggestion process.
 * - AdaptiveExplanationsInput: The input type for the explainAndSuggest function.
 * - AdaptiveExplanationsOutput: The return type for the explainAndSuggest function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdaptiveExplanationsInputSchema = z.object({
  topic: z.string().describe('The academic topic the user wants an explanation for.'),
  userUnderstandingLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The user\'s current understanding level of the topic.'),
  academicContext: z.string().optional().describe('Optional academic context or previous performance data relevant to the user\'s learning.'),
});
export type AdaptiveExplanationsInput = z.infer<typeof AdaptiveExplanationsInputSchema>;

const AdaptiveExplanationsOutputSchema = z.object({
  explanation: z.string().describe('An explanation of the topic adapted to the user\'s understanding level.'),
  improvementSuggestions: z.array(z.string()).describe('A list of actionable suggestions for academic improvement related to the topic.'),
  quotaExceeded: z.boolean().optional().describe('Flag para cuota agotada.'),
});
export type AdaptiveExplanationsOutput = z.infer<typeof AdaptiveExplanationsOutputSchema>;

export async function explainAndSuggest(input: AdaptiveExplanationsInput): Promise<AdaptiveExplanationsOutput> {
  return adaptiveExplanationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptiveExplanationsPrompt',
  input: { schema: AdaptiveExplanationsInputSchema },
  output: { schema: AdaptiveExplanationsOutputSchema },
  prompt: `Eres un tutor de IA experto, altamente pedagógico y adaptable. Tu objetivo es explicar un tema académico y proporcionar sugerencias personalizadas para mejorar.

El usuario ha solicitado una explicación sobre el siguiente tema: '{{{topic}}}'.
Su nivel de comprensión actual es: '{{{userUnderstandingLevel}}}'.

{{#if academicContext}}
También se proporciona el siguiente contexto académico adicional:
'{{{academicContext}}}'
{{/if}}

Por favor, proporciona una explicación clara, concisa y precisa del tema, adaptando tu lenguaje y profundidad al nivel de comprensión del usuario ('{{{userUnderstandingLevel}}}'). Utiliza ejemplos y analogías si es apropiado para el nivel.

Después de la explicación, ofrece una lista de sugerencias de mejora académica personalizadas para el usuario, teniendo en cuenta el tema y su nivel. Estas sugerencias deben ser prácticas y ayudar al usuario a abordar sus debilidades y aprender de manera más eficiente. Cada sugerencia debe ser un elemento separado en la lista.`,
});

const adaptiveExplanationsFlow = ai.defineFlow(
  {
    name: 'adaptiveExplanationsFlow',
    inputSchema: AdaptiveExplanationsInputSchema,
    outputSchema: AdaptiveExplanationsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return {
          explanation: "El servicio de tutoría adaptativa está experimentando una alta carga (Cuota de IA agotada). Por favor, intenta de nuevo en unos segundos para recibir tu explicación personalizada.",
          improvementSuggestions: ["Intenta de nuevo en un momento"],
          quotaExceeded: true
        };
      }
      throw error;
    }
  }
);
