'use server';
/**
 * @fileOverview A Genkit flow to generate structured summaries, outlines, or conceptual maps from text.
 *
 * - generateStructuredSummary - A function that handles the generation process.
 * - GenerateStructuredSummaryInput - The input type for the generateStructuredSummary function.
 * - GenerateStructuredSummaryOutput - The return type for the generateStructuredSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const GenerateStructuredSummaryInputSchema = z.object({
  text: z.string().describe('The text content to be summarized, outlined, or converted into a conceptual map.'),
  format: z.enum(['summary', 'outline', 'conceptual_map']).describe('The desired output format: "summary", "outline", or "conceptual_map".'),
  detailLevel: z.enum(['concise', 'standard', 'detailed']).default('standard').describe('The desired level of detail for the output: "concise", "standard", or "detailed".'),
});
export type GenerateStructuredSummaryInput = z.infer<typeof GenerateStructuredSummaryInputSchema>;

// Output Schema
const GenerateStructuredSummaryOutputSchema = z.object({
  structuredContent: z.string().describe('The generated structured content (summary, outline, or conceptual map) in markdown format.'),
  quotaExceeded: z.boolean().optional().describe('Flag para cuota agotada.'),
});
export type GenerateStructuredSummaryOutput = z.infer<typeof GenerateStructuredSummaryOutputSchema>;

// Wrapper function
export async function generateStructuredSummary(
  input: GenerateStructuredSummaryInput
): Promise<GenerateStructuredSummaryOutput> {
  return generateStructuredSummaryFlow(input);
}

// Prompt definition
const structuredSummaryPrompt = ai.definePrompt({
  name: 'structuredSummaryPrompt',
  input: {schema: GenerateStructuredSummaryInputSchema},
  output: {schema: GenerateStructuredSummaryOutputSchema},
  prompt: `You are an expert academic assistant specialized in generating structured study materials.
Your task is to take the provided text and transform it into the requested format and detail level.

---
**Instructions:**
- **Format:** Generate the output in markdown format.
- **Detail Level:** Adjust the detail based on "{{{detailLevel}}}".
  - "concise": Provide only the most critical information, key points, or main headings.
  - "standard": Offer a balanced amount of detail, covering main points and important sub-points.
  - "detailed": Include comprehensive information, explaining concepts thoroughly with examples if applicable.

---
**Requested Output Format:** {{{format}}}

**If 'summary':** Provide a well-structured summary of the text.
**If 'outline':** Create a hierarchical outline using markdown headings and bullet points.
**If 'conceptual_map':** Describe the main concepts and their relationships, suitable for visualization as a conceptual map (e.g., list main concepts and their connections).

---
**Text to process:**
{{{text}}}

---
Please provide the output in the specified format and detail level. The output should be a single string containing the markdown content.`,
});

// Flow definition
const generateStructuredSummaryFlow = ai.defineFlow(
  {
    name: 'generateStructuredSummaryFlow',
    inputSchema: GenerateStructuredSummaryInputSchema,
    outputSchema: GenerateStructuredSummaryOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await structuredSummaryPrompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return {
          structuredContent: "### ⚠️ Motor de Síntesis en Pausa\nEl servicio de resúmenes por IA ha alcanzado su límite de cuota temporal. Estamos optimizando recursos para tu cuenta. Por favor, reintenta la generación en unos segundos.",
          quotaExceeded: true
        };
      }
      throw error;
    }
  }
);
