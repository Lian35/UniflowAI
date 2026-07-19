"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, AlertTriangle, Loader2, Sparkles, Zap, ArrowRightCircle } from "lucide-react"
import { getAcademicInsights } from "@/ai/flows/academic-insights-flow"

export default function PredictionPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "tasks")
  }, [user, db])

  const { data: tasks } = useCollection(tasksQuery)

  const handlePredict = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await getAcademicInsights({
        type: 'prediction',
        userPerformanceData: {
          tasksCompleted: tasks?.filter(t => t.status === 'Completed').length || 0,
          pendingTasks: tasks?.filter(t => t.status === 'Pending').length || 0,
          studyMinutesTotal: 0,
          recentSubjects: []
        }
      })
      setPrediction(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Predicción e Impacto</h1>
          <p className="text-muted-foreground">Analizamos tu futuro para cambiar tu presente</p>
        </div>
        <Button 
          onClick={handlePredict} 
          disabled={loading}
          variant="accent"
          className="gap-2 font-bold shadow-xl shadow-accent/20 h-12 px-8"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Target className="h-5 w-5" />}
          Generar Pronóstico de Impacto
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {prediction ? (
            <div className="space-y-6">
              <Card className="border-none shadow-lg overflow-hidden">
                <div className={`h-1 ${prediction.status === 'risk' ? 'bg-destructive' : 'bg-accent'}`} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Escenario Académico Estimado
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed text-lg">{prediction.mainInsight}</div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {prediction.recommendations.map((rec: any, i: number) => (
                  <Card key={i} className="border-none shadow-md bg-white dark:bg-card hover:translate-y-[-2px] transition-transform">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge variant={rec.impact === 'high' ? 'destructive' : 'secondary'}>Impacto {rec.impact}</Badge>
                        <Zap className={`h-4 w-4 ${rec.impact === 'high' ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <CardTitle className="text-sm mt-2">{rec.text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="p-0 h-auto text-xs font-bold text-primary group">
                        Ejecutar Acción <ArrowRightCircle className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <TrendingUp className="h-16 w-16 mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-xl font-bold opacity-40">Sin datos de impacto</h3>
              <p className="text-sm opacity-40">La IA necesita procesar tus datos actuales para predecir escenarios.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-destructive/10 border-destructive/20 text-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest">
                <AlertTriangle className="h-4 w-4" /> Alertas Críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4">
              <p className="font-medium">Basado en tu tendencia de los últimos 7 días:</p>
              <ul className="space-y-2">
                <li className="flex gap-2">• La probabilidad de aplazar el proyecto final ha subido un 15%.</li>
                <li className="flex gap-2">• Tu racha de estudio está en peligro por inactividad matutina.</li>
              </ul>
            </CardContent>
          </Card>
          
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
            <h4 className="text-xs font-bold uppercase mb-2">Disciplina UniFlow</h4>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[82%]" />
            </div>
            <p className="text-[10px] mt-2 text-muted-foreground">Tu disciplina está por encima del 82% de los usuarios. ¡No bajes la guardia!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
