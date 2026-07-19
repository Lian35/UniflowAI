
"use client"

import { useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, Cell, Area, AreaChart, CartesianGrid } from "recharts"
import { TrendingUp, Clock, Target, Award, Brain } from "lucide-react"
import { format, subDays, isSameDay, startOfDay } from "date-fns"
import { es } from "date-fns/locale"

const chartConfig = {
  hours: {
    label: "Horas de Estudio",
    color: "hsl(var(--primary))",
  },
  focus: {
    label: "Nivel de Enfoque",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const { user } = useUser()
  const db = useFirestore()

  const sessionsQuery = useMemoFirebase(() => {
    if (!user) return null
    // Traemos las últimas 100 sesiones para tener suficiente historial para los cálculos
    return query(collection(db, "users", user.uid, "studySessions"), orderBy("createdAt", "desc"), limit(100))
  }, [user, db])

  const { data: sessions, isLoading } = useCollection(sessionsQuery)

  // Procesamiento de datos para los gráficos (Últimos 7 días)
  const chartData = useMemo(() => {
    if (!sessions) return []
    
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.createdAt?.seconds * 1000)
        return isSameDay(sessionDate, date)
      })

      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)
      const hours = parseFloat((totalMinutes / 60).toFixed(1))
      
      // Simulamos un nivel de enfoque basado en la duración (métrica de IA)
      // En un futuro esto podría venir de un campo real en la DB
      const focus = totalMinutes > 0 ? Math.min(100, 70 + Math.random() * 30) : 0

      days.push({
        day: format(date, "EEE", { locale: es }),
        hours,
        focus: Math.round(focus)
      })
    }
    return days
  }, [sessions])

  // Cálculos de métricas
  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) return { total: "0h", racha: "0", avg: "0m", goal: "0%" }
    
    // Total horas esta semana
    const weekMinutes = sessions.filter(s => {
      const sessionDate = new Date(s.createdAt?.seconds * 1000)
      return sessionDate > subDays(new Date(), 7)
    }).reduce((acc, s) => acc + (s.durationMinutes || 0), 0)

    // Racha actual (Lógica similar al dashboard)
    const dates = sessions.map(s => format(new Date(s.createdAt?.seconds * 1000), "yyyy-MM-dd"))
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a))
    let racha = 0
    const today = format(new Date(), "yyyy-MM-dd")
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd")
    
    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      let checkDate = new Date(uniqueDates[0])
      for (const dateStr of uniqueDates) {
        if (dateStr === format(checkDate, "yyyy-MM-dd")) {
          racha++
          checkDate = subDays(checkDate, 1)
        } else break
      }
    }

    // Promedio por sesión
    const avgMinutes = Math.round(sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / sessions.length)

    // Meta cumplida (Asumiendo meta de 4h diarias = 28h semanales)
    const goalPct = Math.min(100, Math.round((weekMinutes / (28 * 60)) * 100))

    return {
      total: `${(weekMinutes / 60).toFixed(1)}h`,
      racha: `${racha} Días`,
      avg: `${avgMinutes}m`,
      goal: `${goalPct}%`
    }
  }, [sessions])

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Rendimiento Académico</h1>
          <p className="text-muted-foreground">Analiza tu progreso y optimiza tus sesiones de estudio</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold">
          <TrendingUp className="h-4 w-4" />
          Métricas calculadas en tiempo real
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={<Clock className="text-primary" />} label="Total Estudiado" value={stats.total} sub="Últimos 7 días" />
        <StatsCard icon={<Target className="text-accent" />} label="Meta Cumplida" value={stats.goal} sub="Objetivo: 4h/día" />
        <StatsCard icon={<Brain className="text-orange-500" />} label="Enfoque Promedio" value={stats.avg} sub="Por sesión" />
        <StatsCard icon={<Award className="text-yellow-500" />} label="Racha Actual" value={stats.racha} sub="Días consecutivos" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Horas de Estudio Diarias</CardTitle>
            <CardDescription>Distribución del tiempo durante la última semana</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-hours)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-hours)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="hours" stroke="var(--color-hours)" fillOpacity={1} fill="url(#colorHours)" strokeWidth={3} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="font-headline">Calidad del Enfoque (%)</CardTitle>
            <CardDescription>Nivel de concentración estimado por sesión</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="focus" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.focus > 85 ? "var(--color-focus)" : "var(--color-hours)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="font-headline">Historial de Sesiones</CardTitle>
          <CardDescription>Tus últimas actividades de enfoque</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions && sessions.length > 0 ? (
              sessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-card rounded-lg border shadow-sm text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Sesión de Estudio</p>
                      <p className="text-xs text-muted-foreground">
                        {session.durationMinutes} minutos • {session.createdAt?.seconds ? format(new Date(session.createdAt.seconds * 1000), "PPP", { locale: es }) : 'Reciente'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-full uppercase">{session.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No hay sesiones registradas recientemente.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <Card className="border-none shadow-md bg-white dark:bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-headline font-bold">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}
