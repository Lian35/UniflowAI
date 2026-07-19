
"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { generateStudyPlan } from "@/ai/flows/automated-study-planner"
import { Loader2, Sparkles, Calendar, Clock, BookOpen, AlertCircle, Settings2, CheckCircle2, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StudyPlannerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [showConfig, setShowConfig] = useState(true)

  const [studentProfile, setStudentProfile] = useState({
    academicGoals: "Pasar el semestre con alto rendimiento y dominar los temas complejos.",
    studyHabits: "Estudio nocturno, bloques de 50 min con 10 min de descanso."
  })

  // Fetch real data to fuel the IA
  const subjectsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "subjects"), where("status", "==", "Current"))
  }, [user, db])

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "tasks"), where("status", "==", "Pending"))
  }, [user, db])

  const { data: subjects } = useCollection(subjectsQuery)
  const { data: tasks } = useCollection(tasksQuery)

  const handleGenerate = async () => {
    if (!user) return
    setIsGenerating(true)
    
    try {
      // Map Firestore subjects to AI Input
      const courses = subjects?.map(s => {
        const subjectTasks = tasks?.filter(t => t.subjectId === s.id) || []
        return {
          name: s.name,
          difficulty: s.isBaseSubject ? "hard" : "medium" as any,
          currentProgress: "En curso",
          upcomingDeadlines: subjectTasks.map(t => ({
            name: t.title,
            date: t.dueDate || new Date().toISOString().split('T')[0],
            priority: t.priority?.toLowerCase() || "medium" as any
          }))
        }
      }) || []

      if (courses.length === 0) {
        toast({
          title: "Sin materias activas",
          description: "Debes tener materias en estado 'Matriculada' para generar un plan.",
          variant: "destructive"
        })
        setIsGenerating(false)
        setShowConfig(true)
        return
      }

      const result = await generateStudyPlan({
        studentProfile,
        courses,
        availableStudyHours: {
          monday: 4, tuesday: 4, wednesday: 4, thursday: 4, friday: 4, saturday: 2, sunday: 0
        },
        planStartDate: new Date().toISOString().split('T')[0],
        planEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days plan
      })

      setPlan(result)
      setShowConfig(false)
      toast({ title: "Plan Generado", description: "Tu ruta táctica está lista para revisión." })
    } catch (error: any) {
      console.error(error)
      toast({ title: "Error de IA", description: error.message || "No se pudo generar el plan.", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Planificador Dinámico</h1>
          <p className="text-muted-foreground">Rutas de aprendizaje generadas por el Cerebro UniFlow</p>
        </div>
        {plan && !showConfig && (
          <Button variant="outline" onClick={() => setShowConfig(true)} className="gap-2 font-bold h-12 rounded-2xl border-2">
            <Settings2 className="h-4 w-4" /> Ajustar Perfil
          </Button>
        )}
      </div>

      {showConfig ? (
        <Card className="border-none shadow-2xl bg-white dark:bg-card rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/5 p-10 border-b">
            <CardTitle className="text-2xl font-headline flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" /> Configuración de Perfil Académico
            </CardTitle>
            <CardDescription>Dinos tus metas y cómo prefieres estudiar para que la IA optimice tu tiempo.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="grid gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tus Objetivos Estratégicos</Label>
                <Textarea 
                  placeholder="Ej: Aprobar Cálculo III con promedio > 4.5 y terminar el proyecto de Estructuras de Datos antes del viernes." 
                  className="min-h-[120px] rounded-[1.5rem] bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary/20 p-6 text-base"
                  value={studentProfile.academicGoals}
                  onChange={(e) => setStudentProfile({...studentProfile, academicGoals: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Hábitos de Estudio & Preferencias</Label>
                <Textarea 
                  placeholder="Ej: Prefiero bloques de enfoque de 50 min. Las mañanas soy más productivo pero las noches estudio con más calma." 
                  className="min-h-[120px] rounded-[1.5rem] bg-muted/20 border-none focus-visible:ring-2 focus-visible:ring-primary/20 p-6 text-base"
                  value={studentProfile.studyHabits}
                  onChange={(e) => setStudentProfile({...studentProfile, studyHabits: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !studentProfile.academicGoals || !studentProfile.studyHabits}
                size="lg"
                className="h-16 px-12 rounded-2xl font-black text-lg gap-3 shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                {isGenerating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                {plan ? 'Regenerar Mi Plan' : 'Generar Mi Plan Estratégico'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : plan ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {plan.studyPlan?.map((day: any, idx: number) => (
              <Card key={idx} className="border-none shadow-xl overflow-hidden rounded-[2.5rem] bg-white dark:bg-card">
                <div className="bg-primary/5 px-8 py-5 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3 font-headline font-black text-primary uppercase text-sm tracking-widest">
                    <Calendar className="h-5 w-5" />
                    {day.date}
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-card border-2 border-primary/10 rounded-full px-4 font-bold text-[10px] uppercase">
                    {day.dailySummary}
                  </Badge>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-muted/10">
                    {day.tasks.map((task: any, tIdx: number) => (
                      <div key={tIdx} className="p-8 flex flex-col md:flex-row md:items-center gap-6 hover:bg-muted/5 transition-all">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-headline font-bold text-xl">{task.courseName}</h4>
                            <Badge variant="secondary" className="text-[9px] font-black uppercase px-3 py-1 rounded-full">{task.type}</Badge>
                          </div>
                          <p className="text-muted-foreground font-medium">{task.topic}</p>
                          {task.notes && (
                            <div className="text-xs p-4 bg-muted/20 rounded-2xl border-l-4 border-primary italic">
                              {task.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-center px-6 py-3 bg-muted/30 rounded-2xl border">
                            <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                            <span className="text-sm font-black">{task.durationMinutes}m</span>
                          </div>
                          <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-primary/10 hover:text-primary">
                            <CheckCircle2 className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-2xl bg-black text-white rounded-[3rem] p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Sparkles className="h-32 w-32" /></div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Análisis Estratégico</h3>
                <p className="text-sm leading-relaxed opacity-80 font-medium leading-relaxed">{plan.overallRecommendations}</p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfig(true)}
                  className="w-full h-12 bg-white/5 border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all"
                >
                  <Settings2 className="h-4 w-4 mr-2" /> Ajustar Perfil AI
                </Button>
              </div>
            </Card>

            {plan.warningMessages && plan.warningMessages.length > 0 && (
              <Card className="border-none shadow-xl border-l-[12px] border-destructive bg-white dark:bg-card rounded-[2.5rem]">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" /> Alertas Críticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-3">
                  {plan.warningMessages.map((warning: string, wIdx: number) => (
                    <div key={wIdx} className="text-xs p-4 bg-destructive/5 rounded-2xl border border-destructive/10 font-bold leading-relaxed">
                      {warning}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center max-w-2xl mx-auto space-y-10 py-20">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/10 scale-150" />
            <div className="p-10 bg-primary/10 rounded-full relative z-10 text-primary shadow-inner">
              <BookOpen className="h-20 w-20" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-headline font-black tracking-tight uppercase">Tu Ruta Maestra de Aprendizaje</h2>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed">
              Nuestro motor de IA analizará tus materias actuales, fechas de exámenes y hábitos personales para crear un calendario táctico perfecto.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="p-8 rounded-[2rem] border-2 border-dashed bg-white dark:bg-card shadow-lg flex flex-col items-center gap-3">
              <Target className="h-8 w-8 text-accent" />
              <p className="text-xs font-black uppercase tracking-widest">Metas Claras</p>
            </div>
            <div className="p-8 rounded-[2rem] border-2 border-dashed bg-white dark:bg-card shadow-lg flex flex-col items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <p className="text-xs font-black uppercase tracking-widest">Tiempo Optimizado</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
