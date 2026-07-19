'use server';
/**
 * @fileOverview Flow for generating qualitative academic insights, risk analysis, and video recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AcademicInsightsInputSchema = z.object({
  type: z.enum(['analysis', 'prediction', 'agenda', 'proactive_status']).describe('The type of insight requested.'),
  userPerformanceData: z.object({
    tasksCompleted: z.number(),
    pendingTasks: z.number(),
    overdueTasks: z.number().optional(),
    studyMinutesTotal: z.number(),
    recentSubjects: z.array(z.string()),
    streak: z.number().optional(),
    aiContext: z.record(z.any()).optional().describe('Long-term memory of the user (strengths, weaknesses).'),
  }).describe('Data about the user\'s actual performance history.'),
});
export type AcademicInsightsInput = z.infer<typeof AcademicInsightsInputSchema>;

const AcademicInsightsOutputSchema = z.object({
  mainInsight: z.string().describe('The qualitative analysis and mentoring text.'),
  status: z.enum(['normal', 'risk', 'recovery']).default('normal'),
  recommendations: z.array(z.object({
    text: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    actionType: z.string(),
  })),
  urgencyLevel: z.number().min(0).max(100),
  atRiskSubjects: z.array(z.string()).optional().describe('Subjects identified as high risk.'),
  videoRecommendations: z.array(z.object({
    title: z.string(),
    reason: z.string(),
    searchQuery: z.string().describe('Keywords to search on YouTube.'),
  })).optional(),
  quotaExceeded: z.boolean().optional().describe('Flag to indicate the AI service is currently throttled.'),
});
export type AcademicInsightsOutput = z.infer<typeof AcademicInsightsOutputSchema>;

export async function getAcademicInsights(input: AcademicInsightsInput): Promise<AcademicInsightsOutput> {
  return academicInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'academicInsightsPrompt',
  input: { schema: AcademicInsightsInputSchema },
  output: { schema: AcademicInsightsOutputSchema },
  prompt: `Eres el Cerebro Proactivo de UniFlow AI. Tu misión es actuar como un mentor académico de alto rendimiento.

CONTEXTO DE MEMORIA (Persistente):
{{{userPerformanceData.aiContext}}}

DATOS ACTUALES:
- Tareas completadas: {{{userPerformanceData.tasksCompleted}}}
- Pendientes: {{{userPerformanceData.pendingTasks}}}
- Minutos de estudio: {{{userPerformanceData.studyMinutesTotal}}}
- Materias recientes: {{{userPerformanceData.recentSubjects}}}

TAREA:
1. Realiza un análisis cualitativo profundo.
2. Identifica si alguna materia de "{{{userPerformanceData.recentSubjects}}}" está en riesgo por baja actividad o tareas pendientes.
3. Genera recomendaciones de acción inmediata.
4. Sugiere términos de búsqueda para videos educativos de YouTube que ayuden a reforzar las materias mencionadas.

Responde siempre en español, con tono profesional y motivador.`,
});

const academicInsightsFlow = ai.defineFlow(
  {
    name: 'academicInsightsFlow',
    inputSchema: AcademicInsightsInputSchema,
    outputSchema: AcademicInsightsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return {
          mainInsight: "El servicio de IA ha alcanzado su límite de peticiones gratuitas. Por favor, espera unos 30 segundos y vuelve a pulsar el botón para generar el diagnóstico.",
          status: 'normal',
          recommendations: [
            { text: "Límite de cuota alcanzado: Reintenta en un momento", impact: "low", actionType: "SISTEMA" }
          ],
          urgencyLevel: 0,
          quotaExceeded: true
        };
      }
      throw error;
    }
  }
);
