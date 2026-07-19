"use client"

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, CheckSquare, Clock, GraduationCap, AlertTriangle, Zap, Sparkles, Trophy, Star, Loader2, BrainCircuit, TrendingUp, Calendar, Scale } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { useMemo, useState, useEffect } from "react"
import { format, startOfWeek, addDays, isSameDay, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { getAcademicInsights } from "@/ai/flows/academic-insights-flow"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Persistent AI Context
  const aiContextRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid, "settings", "ai_context")
  }, [user, db])
  const { data: aiContextDoc, isLoading: isContextLoading } = useDoc(aiContextRef)

  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "tasks"), orderBy("dueDate", "asc"))
  }, [user, db])

  const sessionsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "studySessions"), orderBy("createdAt", "desc"), limit(100))
  }, [user, db])

  const subjectsQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "subjects")
  }, [user, db])

  const { data: allTasks, isLoading: tasksLoading } = useCollection(tasksQuery)
  const { data: sessions, isLoading: sessionsLoading } = useCollection(sessionsQuery)
  const { data: subjects } = useCollection(subjectsQuery)

  const pendingTasks = allTasks?.filter(t => t.status === 'Pending') || []
  const completedTasks = allTasks?.filter(t => t.status === 'Completed') || []
  const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
  const criticalSubjects = subjects?.filter(s => s.status === 'Failed' || s.isBaseSubject) || []

  // Strategic Metrics
  const creditStats = useMemo(() => {
    if (!subjects) return { current: 0, total: 0, percent: 0, load: 'balanced' }
    const current = subjects.filter(s => s.status === 'Current').reduce((acc, s) => acc + (s.credits || 0), 0)
    const approved = subjects.filter(s => s.status === 'Passed').reduce((acc, s) => acc + (s.credits || 0), 0)
    const total = subjects.reduce((acc, s) => acc + (s.credits || 0), 0)
    return {
      current,
      total,
      percent: total > 0 ? Math.round((approved / total) * 100) : 0,
      load: current > 24 ? 'heavy' : current > 18 ? 'balanced' : 'light'
    }
  }, [subjects])

  const stats = useMemo(() => {
    if (!sessions || !allTasks) return { totalXP: 0, currentLevel: 1, progressPercent: 0, streak: 0, totalHours: "0.0" }
    
    const calculateStreak = (sessionsList: any[]) => {
      if (!sessionsList.length) return 0
      const dates = sessionsList.map(s => format(s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000) : new Date(), "yyyy-MM-dd"))
      const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a))
      const today = format(new Date(), "yyyy-MM-dd")
      const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd")
      if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0
      
      let currentStreak = 0
      let checkDate = new Date(uniqueDates[0])
      for (const dateStr of uniqueDates) {
        if (dateStr === format(checkDate, "yyyy-MM-dd")) {
          currentStreak++
          checkDate = subDays(checkDate, 1)
        } else break
      }
      return currentStreak
    }

    const streakVal = calculateStreak(sessions)
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)
    const xp = (completedTasks.length * 50) + (totalMinutes * 1) + (streakVal * 100)
    
    return {
      totalXP: xp,
      currentLevel: Math.floor(xp / 1000) + 1,
      progressPercent: (xp % 1000) / 10,
      streak: streakVal,
      totalHours: (totalMinutes / 60).toFixed(1)
    }
  }, [sessions, allTasks, completedTasks.length])

  // Intelligence Proactive Loop
  useEffect(() => {
    if (user && allTasks && sessions && !isContextLoading && !isAnalyzing) {
      const runIntelligenceUpdate = async () => {
        const lastAnalysis = aiContextDoc?.lastAnalysisUpdate?.seconds || 0
        const now = Math.floor(Date.now() / 1000)
        
        // Cooldown check: 30 minutes
        if (now - lastAnalysis < 1800 && aiContextDoc?.lastStatus) {
          setAiStatus({
            status: aiContextDoc.lastStatus,
            urgencyLevel: aiContextDoc.urgencyLevel || 0,
            mainInsight: aiContextDoc.lastMainInsight,
            recommendations: (aiContextDoc.recommendationsHistory || []).map((text: string) => ({ text, impact: 'medium', actionType: 'HISTORIAL' }))
          })
          return 
        }

        setIsAnalyzing(true)
        try {
          // Sanitize aiContext to plain object before passing to Server Function
          const sanitizedAiContext = aiContextDoc ? JSON.parse(JSON.stringify(aiContextDoc)) : {}

          const result = await getAcademicInsights({
            type: 'proactive_status',
            userPerformanceData: {
              tasksCompleted: completedTasks.length,
              pendingTasks: pendingTasks.length,
              overdueTasks: overdueTasks.length,
              studyMinutesTotal: sessions.reduce((a,c) => a+(c.durationMinutes||0),0),
              recentSubjects: Array.from(new Set(allTasks.map(t => t.subjectId))).slice(0, 3),
              streak: stats.streak,
              aiContext: sanitizedAiContext
            }
          })
          
          setAiStatus(result)

          // Solo guardamos en Firestore si no fue una respuesta de contingencia por cuota
          if (!result.quotaExceeded) {
            setDoc(doc(db, "users", user.uid, "settings", "ai_context"), {
              lastStatus: result.status,
              urgencyLevel: result.urgencyLevel,
              lastMainInsight: result.mainInsight,
              lastAnalysisUpdate: serverTimestamp(),
              recommendationsHistory: result.recommendations.map(r => r.text)
            }, { merge: true })
          }
        } catch (error: any) {
          console.warn("AI Insights background update paused:", error.message)
        } finally {
          setIsAnalyzing(false)
        }
      }
      runIntelligenceUpdate()
    }
  }, [user, allTasks?.length, sessions?.length, aiContextDoc, isContextLoading])

  const weeklyData = useMemo(() => {
    const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    return days.map((name, index) => {
      const date = addDays(monday, index)
      const total = sessions?.filter(s => isSameDay(new Date(s.createdAt?.seconds * 1000), date)).reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0) || 0
      return { name, hours: parseFloat((total / 60).toFixed(1)) }
    })
  }, [sessions])

  if (tasksLoading || sessionsLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <Skeleton className="h-48 rounded-3xl" />
        <div className="grid gap-6 grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in fade-in duration-1000">
      {/* Hero Strategic Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-gradient-to-br from-primary via-primary to-accent text-white p-10 relative overflow-hidden rounded-[3rem]">
          <div className="absolute top-0 right-0 p-12 opacity-10 animate-float">
            <Trophy className="h-48 w-48 rotate-12" />
          </div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em]">Nivel {stats.currentLevel}</div>
              <h2 className="text-4xl font-headline font-black tracking-tight">¡Bienvenido al Mando, {user?.displayName?.split(' ')[0]}!</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em]">
                <span>Avance de Carrera (ITI ACD/16)</span>
                <span>{creditStats.percent}% Completado</span>
              </div>
              <Progress value={creditStats.percent} className="h-5 bg-white/20 [&>div]:bg-white rounded-full shadow-2xl" />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-white/60" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Carga: {creditStats.current} CR</span>
              </div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-white/60" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">IA Estratégica Activa</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-2xl bg-white dark:bg-card rounded-[3rem] p-10 flex flex-col justify-center text-center">
          <div className="p-6 bg-accent/10 rounded-[2.5rem] mb-6 inline-block mx-auto">
            <Star className="h-12 w-12 text-accent fill-accent" />
          </div>
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Puntos de Maestría</h3>
          <p className="text-4xl font-headline font-black mb-2">{stats.totalXP}</p>
          <Badge variant="secondary" className="rounded-full px-6 py-1.5 font-black uppercase text-[9px] tracking-widest mx-auto">
            Top 5% del Ecosistema
          </Badge>
        </Card>
      </div>

      {/* Strategic Alerts */}
      <div className="grid gap-8 lg:grid-cols-2">
        {aiStatus && (
          <Card className={cn(
            "border-none shadow-2xl rounded-[3rem] p-10 flex items-center gap-8 transition-all duration-700",
            creditStats.load === 'heavy' || aiStatus.status === 'risk' ? 'bg-destructive/10' : 'bg-primary/5'
          )}>
            <div className={cn(
              "p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in",
              creditStats.load === 'heavy' || aiStatus.status === 'risk' ? 'bg-destructive text-white' : 'bg-primary text-white'
            )}>
              {creditStats.load === 'heavy' ? <AlertTriangle className="h-10 w-10 animate-pulse" /> : <Sparkles className="h-10 w-10" />}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="font-black uppercase tracking-widest text-[9px]">Estrategia IA</Badge>
                <h3 className="text-xl font-headline font-black uppercase">Diagnóstico de Carga</h3>
              </div>
              <p className="text-lg font-medium leading-relaxed opacity-80">
                {creditStats.load === 'heavy' 
                  ? `Carga de ${creditStats.current} créditos es excesiva. Prioriza materias core y usa bloques de enfoque de 50 min.` 
                  : aiStatus.mainInsight}
              </p>
            </div>
          </Card>
        )}

        {criticalSubjects.length > 0 && (
          <Card className="border-none shadow-2xl bg-orange-500/5 rounded-[3rem] p-10 flex items-center gap-8">
            <div className="p-6 rounded-[2.5rem] bg-orange-500 text-white shadow-2xl">
              <Zap className="h-10 w-10" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-headline font-black uppercase">Puntos Críticos</h3>
              <div className="flex flex-wrap gap-2">
                {criticalSubjects.slice(0, 3).map(s => (
                  <Badge key={s.id} variant="outline" className="bg-white/50 border-orange-500/20 text-orange-600 font-black text-[9px] uppercase">{s.name} ({s.credits} CR)</Badge>
                ))}
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Estas materias definen tu rendimiento semestral.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Inversión Tiempo" value={`${stats.totalHours}h`} sub="Estudio Registrado" icon={<Clock className="text-primary" />} />
        <MetricCard title="Entregas" value={pendingTasks.length} sub={overdueTasks.length > 0 ? `${overdueTasks.length} Críticas` : "Al día"} icon={<CheckSquare className={overdueTasks.length > 0 ? 'text-destructive' : 'text-accent'} />} />
        <MetricCard title="Racha de Enfoque" value={stats.streak} sub="Días consecutivos" icon={<Zap className="text-orange-500" />} />
        <MetricCard title="Carga Real" value={creditStats.current} sub="Créditos ACD/16" icon={<TrendingUp className="text-green-500" />} />
      </div>

      {/* Analytics & AI Plan */}
      <div className="grid gap-10 lg:grid-cols-7 items-start">
        <Card className="lg:col-span-4 border-none shadow-2xl bg-white dark:bg-card rounded-[3.5rem] overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight">Actividad Semanal</CardTitle>
                <CardDescription className="font-bold">Distribución de esfuerzo por día</CardDescription>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-10 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={10} className="font-black text-muted-foreground uppercase" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} className="font-black text-muted-foreground uppercase" />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px 24px' }}
                />
                <Bar dataKey="hours" radius={[12, 12, 12, 12]} barSize={40}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hours > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"} className="transition-all duration-500 hover:opacity-80" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-2xl bg-white dark:bg-card rounded-[3.5rem]">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" /> Plan de Acción
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-4">
            {aiStatus?.recommendations?.map((rec: any, i: number) => (
              <div key={i} className="flex items-center gap-5 p-6 rounded-[2rem] border border-border/50 bg-muted/10 group hover:border-primary/30 transition-all cursor-default">
                <div className={cn(
                  "h-4 w-4 rounded-full shrink-0",
                  rec.impact === 'high' ? 'bg-destructive animate-pulse' : 'bg-primary'
                )} />
                <div className="flex-1">
                  <p className="text-sm font-black leading-tight mb-1">{rec.text}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{rec.actionType}</p>
                </div>
              </div>
            )) || (
              <div className="text-center py-16 space-y-6 opacity-40">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Estrategia...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, sub, icon }: { title: string, value: any, sub: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2.5rem] hover:translate-y-[-6px] transition-all duration-500 group">
      <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors">{title}</CardTitle>
        <div className="p-3 rounded-2xl bg-muted/30 group-hover:bg-primary/5 transition-all">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="text-4xl font-headline font-black tracking-tighter">{value}</div>
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-2">{sub}</p>
      </CardContent>
    </Card>
  )
}
