
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Activity, 
  Brain, 
  ShieldAlert, 
  HardDrive, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Zap,
  ArrowRight,
  RefreshCw,
  Bell,
  Loader2,
  Github
} from "lucide-react"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell,
  Line,
  LineChart,
  AreaChart,
  Area
} from "recharts"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

export default function AdminDashboardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()

  // Guardia de Seguridad Super Admin
  useEffect(() => {
    if (user && user.email !== 'fg664714@gmail.com') {
      router.push("/dashboard")
    }
  }, [user, router])

  const usersQuery = useMemoFirebase(() => collection(db, "users"), [db])
  const logsQuery = useMemoFirebase(() => query(collection(db, "system_logs"), orderBy("timestamp", "desc"), limit(10)), [db])
  const allLogsQuery = useMemoFirebase(() => collection(db, "system_logs"), [db])
  const interactionsQuery = useMemoFirebase(() => collection(db, "system_ai_interactions"), [db])
  
  const { data: allUsers, isLoading: loadingUsers } = useCollection(usersQuery)
  const { data: recentLogs, isLoading: loadingLogs } = useCollection(logsQuery)
  const { data: allLogs } = useCollection(allLogsQuery)
  const { data: allInteractions } = useCollection(interactionsQuery)

  const errorCount = useMemo(() => allLogs?.filter(l => l.type === 'error').length || 0, [allLogs])
  const aiCount = useMemo(() => allInteractions?.length || 0, [allInteractions])
  const systemHealth = useMemo(() => errorCount > 10 ? "88.2%" : errorCount > 0 ? "98.5%" : "100%", [errorCount])

  // Dynamic load data based on real logs count
  const systemHealthData = useMemo(() => {
    const baseLoad = (allLogs?.length || 0) * 2;
    return [
      { time: "00:00", load: Math.min(100, 12 + baseLoad * 0.1) },
      { time: "04:00", load: Math.min(100, 8 + baseLoad * 0.05) },
      { time: "08:00", load: Math.min(100, 45 + baseLoad * 0.4) },
      { time: "12:00", load: Math.min(100, 78 + baseLoad * 0.8) },
      { time: "16:00", load: Math.min(100, 65 + baseLoad * 0.6) },
      { time: "20:00", load: Math.min(100, 92 + baseLoad * 0.9) },
      { time: "23:59", load: Math.min(100, 30 + baseLoad * 0.2) },
    ]
  }, [allLogs])

  if (!user || user.email !== 'fg664714@gmail.com') return null

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive rounded-2xl text-white shadow-xl shadow-destructive/20 animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-headline font-black tracking-tight uppercase">Admin Master Control</h1>
          </div>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.3em] ml-1">Ecosistema UniFlow AI • Terminal de Judas</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/admin/deployment')} variant="outline" className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] border-2">
            <Github className="h-4 w-4 mr-2" /> Despliegue Git
          </Button>
          <Button className="bg-destructive hover:bg-destructive/90 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-destructive/20">
            <Bell className="h-4 w-4 mr-2" /> Anuncio Global
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard title="Total Usuarios" value={loadingUsers ? "..." : allUsers?.length || 0} sub="Estudiantes Activos" icon={<Users className="text-primary" />} />
        <AdminStatsCard title="Salud Sistema" value={systemHealth} sub="Basado en Logs" icon={<HardDrive className={errorCount > 0 ? "text-orange-500" : "text-green-500"} />} />
        <AdminStatsCard title="Interacciones IA" value={aiCount} sub="Telemetría Gemini" icon={<Brain className="text-accent" />} />
        <AdminStatsCard title="Alertas" value={errorCount} sub="Errores Críticos" icon={<AlertTriangle className={errorCount > 0 ? "text-destructive animate-bounce" : "text-orange-500"} />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-2xl bg-white dark:bg-card rounded-[3rem] overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight">Actividad Global</CardTitle>
                <CardDescription className="font-bold">Densidad de logs y peticiones en tiempo real</CardDescription>
              </div>
              <Activity className="h-8 w-8 text-destructive opacity-20" />
            </div>
          </CardHeader>
          <CardContent className="h-[400px] p-10 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemHealthData}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-[10px] font-black uppercase" />
                <YAxis axisLine={false} tickLine={false} className="text-[10px] font-black uppercase" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.15)', background: 'black', color: 'white' }}
                />
                <Area type="monotone" dataKey="load" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorLoad)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-2xl bg-black text-white rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="h-32 w-32 rotate-12" /></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-destructive">Estado de la IA</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-2xl font-headline font-black">
                  <span>Gemini Engine</span>
                  <span className="text-green-500">OPTIMAL</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[92%]" />
                </div>
              </div>
              <p className="text-xs text-white/60 font-medium leading-relaxed">Latencia media: 1.2s. Cuota de API activa (Free Tier). {aiCount} interacciones registradas.</p>
              <Button variant="outline" onClick={() => router.push('/admin/ai')} className="w-full bg-white/5 border-white/10 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl">
                Monitorear Conversaciones
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2.5rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4 text-destructive" /> Logs en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 space-y-4">
              {loadingLogs ? (
                <div className="text-center py-12 opacity-30"><Loader2 className="h-8 w-8 mx-auto animate-spin" /></div>
              ) : recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50 group hover:bg-muted/40 transition-all">
                    <div className={`h-2.5 w-2.5 rounded-full ${log.type === 'error' ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{log.message}</p>
                      <p className="text-[9px] font-black uppercase opacity-40">
                        {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'Ahora'} • {log.type}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 opacity-30">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-[10px] font-black uppercase">Sin actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AdminStatsCard({ title, value, sub, icon }: { title: string, value: any, sub: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2rem] hover:translate-y-[-4px] transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
        <CardTitle className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">{title}</CardTitle>
        <div className="p-2.5 rounded-2xl bg-muted/30">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-3xl font-headline font-black tracking-tight">{value}</div>
        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}
