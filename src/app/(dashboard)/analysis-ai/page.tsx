"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, doc, serverTimestamp } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Sparkles, TrendingUp, Loader2, Lightbulb, Shield, Target, History, AlertCircle } from "lucide-react"
import { getAcademicInsights } from "@/ai/flows/academic-insights-flow"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AnalysisAIPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [insight, setInsight] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const aiContextRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid, "settings", "ai_context")
  }, [user, db])
  const { data: aiContext } = useDoc(aiContextRef)

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "tasks")
  }, [user, db])

  const sessionsQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "studySessions")
  }, [user, db])

  const { data: tasks } = useCollection(tasksQuery)
  const { data: sessions } = useCollection(sessionsQuery)

  const handleGenerate = async () => {
    if (!user) return
    setLoading(true)
    try {
      const sanitizedAiContext = aiContext ? JSON.parse(JSON.stringify(aiContext)) : {}

      const result = await getAcademicInsights({
        type: 'analysis',
        userPerformanceData: {
          tasksCompleted: tasks?.filter(t => t.status === 'Completed').length || 0,
          pendingTasks: tasks?.filter(t => t.status === 'Pending').length || 0,
          studyMinutesTotal: sessions?.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) || 0,
          recentSubjects: Array.from(new Set(tasks?.map(t => t.subjectId) || [])).slice(0, 3),
          aiContext: sanitizedAiContext
        }
      })
      
      setInsight(result)

      if (result.quotaExceeded) {
        toast({
          title: "Sistema ocupado",
          description: "La IA está procesando muchas solicitudes. Espera un momento antes de reintentar.",
          variant: "destructive"
        })
      } else {
        // Registro para el Admin solo si fue exitoso
        addDocumentNonBlocking(collection(db, "system_ai_interactions"), {
          userId: user.uid,
          userName: user.displayName,
          question: "Generar Diagnóstico de Contexto Profundo",
          answer: result.mainInsight,
          timestamp: serverTimestamp(),
          type: 'analysis_ai'
        })
      }

    } catch (error: any) {
      console.warn("AI Insights error:", error.message)
      toast({
        title: "Error de análisis",
        description: "No se pudo generar el diagnóstico en este momento.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Análisis de Contexto AI</h1>
          <p className="text-muted-foreground">Tu mentor inteligente analizando tu memoria académica</p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={loading}
          className="gap-2 font-bold shadow-xl shadow-primary/20 h-12 px-8 rounded-xl"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Generar Diagnóstico Profundo
        </Button>
      </div>

      {insight?.quotaExceeded && (
        <Alert variant="destructive" className="rounded-[2rem] border-destructive/20 bg-destructive/5 animate-in slide-in-from-top-4">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold uppercase text-xs tracking-widest">Límite de IA alcanzado</AlertTitle>
          <AlertDescription className="text-sm font-medium">
            Google Gemini (Free Tier) permite un número limitado de consultas por minuto. Por favor, aguarda 30 segundos y vuelve a pulsar el botón superior para obtener tu análisis.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {insight ? (
            <Card className="border-none shadow-lg rounded-[2.5rem] overflow-hidden">
              <div className="h-1.5 w-full bg-primary" />
              <CardHeader className="p-8">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Informe de Rendimiento & Persistencia
                </CardTitle>
                <CardDescription>Basado en tu historial y comportamiento reciente</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{insight.mainInsight}</div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-20 text-center opacity-60 rounded-[3rem]">
              <div className="p-6 rounded-full bg-muted/50 mb-6">
                <Brain className="h-16 w-16 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Memoria AI en Espera</CardTitle>
              <CardDescription className="max-w-xs mx-auto mt-2 font-medium">Inicia el análisis para que la IA procese tu evolución académica y genere recomendaciones estratégicas.</CardDescription>
            </Card>
          )}

          {aiContext && aiContext.recommendationsHistory && (
            <Card className="border-none shadow-md bg-muted/30 rounded-[2.5rem]">
              <CardHeader className="p-8">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Historial de Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="grid gap-3">
                  {aiContext.recommendationsHistory.slice(0, 5).map((rec: string, i: number) => (
                    <div key={i} className="text-xs p-4 bg-white dark:bg-card rounded-2xl border border-border/50 italic font-medium shadow-sm">
                      "{rec}"
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-primary text-primary-foreground rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Target className="h-5 w-5" /> Foco de Mejora
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <ul className="space-y-4">
                {insight?.recommendations?.map((rec: any, i: number) => (
                  <li key={i} className="text-sm flex gap-3 bg-white/10 p-4 rounded-2xl border border-white/20 transition-transform hover:scale-[1.02]">
                    <Shield className="h-5 w-5 shrink-0 text-white" />
                    <div>
                      <p className="font-bold leading-tight mb-1">{rec.text}</p>
                      <p className="text-[10px] font-black uppercase opacity-70 tracking-tighter">{rec.actionType}</p>
                    </div>
                  </li>
                )) || <p className="text-xs italic opacity-80 text-center py-10">Genera un análisis para ver sugerencias de alto impacto.</p>}
              </ul>
            </CardContent>
          </Card>
          
          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-card shadow-xl border border-dashed text-center space-y-4">
            <Lightbulb className="h-10 w-10 mx-auto text-accent opacity-30" />
            <p className="text-xs text-muted-foreground leading-relaxed font-medium uppercase tracking-widest px-4">
              Tu IA utiliza una ventana de contexto de 30 minutos para asegurar que las recomendaciones sean estables y optimizar los recursos del motor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
