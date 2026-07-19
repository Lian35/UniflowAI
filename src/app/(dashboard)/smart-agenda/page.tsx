"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, ListTodo, Loader2, Zap, CheckCircle2, RefreshCw } from "lucide-react"
import { getAcademicInsights } from "@/ai/flows/academic-insights-flow"
import { Badge } from "@/components/ui/badge"

export default function SmartAgendaPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [agenda, setAgenda] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "tasks")
  }, [user, db])

  const { data: tasks } = useCollection(tasksQuery)
  const pendingTasks = tasks?.filter(t => t.status === 'Pending') || []

  const handleOrganize = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await getAcademicInsights({
        type: 'agenda',
        userPerformanceData: {
          tasksCompleted: tasks?.filter(t => t.status === 'Completed').length || 0,
          pendingTasks: pendingTasks.length,
          studyMinutesTotal: 0,
          recentSubjects: []
        }
      })
      setAgenda(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Agenda Auto-Organizada</h1>
          <p className="text-muted-foreground">La IA ha reordenado tus prioridades para hoy</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleOrganize} 
            disabled={loading || pendingTasks.length === 0}
            className="gap-2 font-bold"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Forzar Re-análisis
          </Button>
          <Button 
            onClick={handleOrganize} 
            disabled={loading || pendingTasks.length === 0}
            className="gap-2 font-bold shadow-xl shadow-primary/20"
          >
            <Zap className="h-4 w-4" />
            Sincronizar IA
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Estado de Tareas ({pendingTasks.length})
                </CardTitle>
                <Badge variant="outline">Impacto en Promedio: Alto</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((task: any) => (
                  <div key={task.id} className="p-4 rounded-xl border bg-muted/20 flex justify-between items-center hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="text-sm font-bold">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{task.dueDate} • {task.type}</p>
                    </div>
                    <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <div className="text-center py-20 opacity-40">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-bold">No hay tareas pendientes.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {agenda ? (
            <Card className={`border-2 shadow-2xl transition-all ${agenda.status === 'risk' ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CalendarDays className="h-5 w-5" />
                    Plan de Reorganización
                  </CardTitle>
                  <Badge className="bg-primary animate-pulse">OPTIMIZADO</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed border-l-4 border-primary pl-4">{agenda.mainInsight}</div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acciones Sugeridas por Impacto:</h4>
                  {agenda.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center p-4 bg-white dark:bg-card rounded-2xl border shadow-sm group hover:border-primary transition-colors">
                      <div className={`p-2 rounded-lg ${rec.impact === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold leading-tight">{rec.text}</p>
                        <p className="text-[9px] uppercase font-medium opacity-60 mt-1">{rec.actionType}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-20 opacity-30 text-center bg-muted/20 rounded-3xl border-2 border-dashed">
              <Zap className="h-16 w-16 mb-4 animate-pulse" />
              <p className="font-bold">Iniciando motor de organización...</p>
              <p className="text-xs mt-2">La IA está analizando los cuellos de botella en tu agenda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
