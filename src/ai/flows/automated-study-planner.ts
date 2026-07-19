'use server';
/**
 * @fileOverview A Genkit flow for generating an automated study plan based on user input.
 *
 * - generateStudyPlan - A function that handles the generation of a study plan.
 * - AutomatedStudyPlannerInput - The input type for the generateStudyPlan function.
 * - AutomatedStudyPlannerOutput - The return type for the generateStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedStudyPlannerInputSchema = z.object({
  studentProfile: z.object({
    academicGoals: z.string().describe('Short description of academic goals.'),
    studyHabits: z.string().describe('Description of preferred study times, durations, and break patterns (e.g., "I prefer to study in the evenings for 2-hour blocks with 15-minute breaks").'),
    currentPerformanceSummary: z.string().optional().describe('Summary of current academic performance and areas for improvement.'),
  }).describe('Details about the student.'),
  courses: z.array(
    z.object({
      name: z.string().describe('Name of the course.'),
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('Perceived difficulty of the course.'),
      currentProgress: z.string().describe('Current status or topics covered in the course.'),
      upcomingDeadlines: z.array(
        z.object({
          name: z.string().describe('Name of the deadline (e.g., "Midterm Exam", "Assignment 3").'),
          date: z.string().describe('Date of the deadline in YYYY-MM-DD format.'),
          priority: z.enum(['low', 'medium', 'high']).describe('Priority of the deadline.'),
        })
      ).describe('List of upcoming assignments, exams, and project deadlines.'),
      estimatedStudyHoursPerWeek: z.number().optional().describe('Estimated hours needed per week for this course.'),
    })
  ).describe('List of current academic courses with their details.'),
  availableStudyHours: z.object({
    monday: z.number().describe('Available study hours on Monday.'),
    tuesday: z.number().describe('Available study hours on Tuesday.'),
    wednesday: z.number().describe('Available study hours on Wednesday.'),
    thursday: z.number().describe('Available study hours on Thursday.'),
    friday: z.number().describe('Available study hours on Friday.'),
    saturday: z.number().describe('Available study hours on Saturday.'),
    sunday: z.number().describe('Available study hours on Sunday.'),
  }).describe('Number of hours the student can realistically study each day.'),
  planStartDate: z.string().describe('The start date for the study plan in YYYY-MM-DD format.'),
  planEndDate: z.string().describe('The end date for the study plan in YYYY-MM-DD format (e.g., end of semester).'),
});
export type AutomatedStudyPlannerInput = z.infer<typeof AutomatedStudyPlannerInputSchema>;

const AutomatedStudyPlannerOutputSchema = z.object({
  studyPlan: z.array(
    z.object({
      date: z.string().describe('Date of the study day in YYYY-MM-DD format.'),
      dailySummary: z.string().describe('A brief summary of the day\'s study focus.'),
      tasks: z.array(
        z.object({
          courseName: z.string().describe('Name of the course.'),
          topic: z.string().describe('Specific topic or task to focus on.'),
          type: z.enum(['study', 'review', 'assignment', 'project', 'exam_prep']).describe('Type of activity.'),
          durationMinutes: z.number().describe('Recommended duration for this task in minutes.'),
          notes: z.string().optional().describe('Additional notes or resources for this task.'),
        })
      ).describe('List of study tasks for the day.'),
    })
  ).describe('The generated comprehensive study plan.'),
  overallRecommendations: z.string().describe('Overall recommendations and tips for the student.'),
  warningMessages: z.array(z.string()).optional().describe('Any warnings or areas where the plan might be ambitious or potential conflicts.'),
  quotaExceeded: z.boolean().optional().describe('Flag to indicate the AI service is currently throttled.'),
});
export type AutomatedStudyPlannerOutput = z.infer<typeof AutomatedStudyPlannerOutputSchema>;

export async function generateStudyPlan(input: AutomatedStudyPlannerInput): Promise<AutomatedStudyPlannerOutput> {
  return automatedStudyPlannerFlow(input);
}

const automatedStudyPlannerPrompt = ai.definePrompt({
  name: 'automatedStudyPlannerPrompt',
  input: {schema: AutomatedStudyPlannerInputSchema},
  output: {schema: AutomatedStudyPlannerOutputSchema},
  prompt: `You are an AI-powered academic assistant specializing in creating optimized study plans for university students.

Generate a detailed and adaptive study plan based on the following student information. The plan should cover the period from {{{planStartDate}}} to {{{planEndDate}}}.

Student Profile:
- Academic Goals: {{{studentProfile.academicGoals}}}
- Study Habits: {{{studentProfile.studyHabits}}}
{{#if studentProfile.currentPerformanceSummary}}- Current Performance Summary: {{{studentProfile.currentPerformanceSummary}}}{{/if}}

Courses and Deadlines:
{{#each courses}}
  - Course Name: {{{name}}}
  - Difficulty: {{{difficulty}}}
  - Current Progress: {{{currentProgress}}}
  {{#if estimatedStudyHoursPerWeek}}- Estimated Weekly Study Hours: {{{estimatedStudyHoursPerWeek}}}{{/if}}
  - Upcoming Deadlines:
    {{#each upcomingDeadlines}}
      - Name: {{{name}}}, Date: {{{date}}}, Priority: {{{priority}}}
    {{else}}
      - No upcoming deadlines.
    {{/each}}
{{/each}}

Available Study Hours per Day (in hours):
  - Monday: {{{availableStudyHours.monday}}}
  - Tuesday: {{{availableStudyHours.tuesday}}}
  - Wednesday: {{{availableStudyHours.wednesday}}}
  - Thursday: {{{availableStudyHours.thursday}}}
  - Friday: {{{availableStudyHours.friday}}}
  - Saturday: {{{availableStudyHours.saturday}}}
  - Sunday: {{{availableStudyHours.sunday}}}

Instructions for Plan Generation:
1.  **Date Range**: Create a plan from {{{planStartDate}}} to {{{planEndDate}}}.
2.  **Prioritization**: Prioritize tasks based on upcoming deadlines (high priority first), course difficulty, and current student progress.
3.  **Balance**: Distribute study time effectively across all courses, ensuring a balanced workload and preventing burnout.
4.  **Habits**: Incorporate the student's study habits and preferred breaks into the daily schedule.
5.  **Task Details**: For each daily task, specify the course name, a specific topic or task, the type of activity (study, review, assignment, project, exam_prep), and its recommended duration in minutes.
6.  **Daily Summary**: Provide a brief daily summary highlighting the main focus for that day.
7.  **Recommendations**: Include overall recommendations for effective studying based on the provided information.
8.  **Warnings**: If the available study hours are insufficient for the workload or if deadlines are too close, include warning messages.

Generate the study plan in JSON format according to the AutomatedStudyPlannerOutputSchema provided in the output schema description. Ensure all fields are populated accurately.`,
});

const automatedStudyPlannerFlow = ai.defineFlow(
  {
    name: 'automatedStudyPlannerFlow',
    inputSchema: AutomatedStudyPlannerInputSchema,
    outputSchema: AutomatedStudyPlannerOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await automatedStudyPlannerPrompt(input);
      return output!;
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        return {
          studyPlan: [],
          overallRecommendations: "El motor de planificación de UniFlow está optimizando recursos en este momento debido a la alta demanda. Por favor, intenta generar tu plan de nuevo en unos segundos.",
          warningMessages: ["Servicio temporalmente saturado"],
          quotaExceeded: true
        };
      }
      throw error;
    }
  }
);
