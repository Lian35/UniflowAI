
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  HardDrive, 
  Activity, 
  Zap, 
  Database, 
  ShieldCheck, 
  Server, 
  Cpu, 
  Network,
  RefreshCw,
  AlertCircle,
  Clock
} from "lucide-react"
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid 
} from "recharts"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const latencyData = [
  { time: "10:00", ms: 45 },
  { time: "10:05", ms: 52 },
  { time: "10:10", ms: 48 },
  { time: "10:15", ms: 120 },
  { time: "10:20", ms: 55 },
  { time: "10:25", ms: 42 },
  { time: "10:30", ms: 50 },
]

export default function SystemHealthPage() {
  const { user } = useUser()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user && user.email !== 'fg664714@gmail.com') {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  if (!user || user.email !== 'fg664714@gmail.com') return null

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-700 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-black uppercase tracking-tight">Salud del Ecosistema</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-1">Monitoreo de Infraestructura y Servicios Críticos</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline" 
          className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] border-2"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Sincronizando...' : 'Refrescar Estado'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <HealthMetricCard 
          title="Uptime" 
          value="99.98%" 
          status="Optimal" 
          icon={<ShieldCheck className="text-green-500" />} 
        />
        <HealthMetricCard 
          title="DB Latency" 
          value="42ms" 
          status="Fast" 
          icon={<Database className="text-primary" />} 
        />
        <HealthMetricCard 
          title="AI Load" 
          value="12%" 
          status="Low" 
          icon={<Zap className="text-accent" />} 
        />
        <HealthMetricCard 
          title="Server Region" 
          value="US-East" 
          status="Active" 
          icon={<Server className="text-orange-500" />} 
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white dark:bg-card rounded-[3rem] overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight">Latencia Global (ms)</CardTitle>
                <CardDescription className="font-bold">Tiempo de respuesta de los servicios core</CardDescription>
              </div>
              <Network className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardHeader>
          <CardContent className="h-[350px] p-10 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-[10px] font-black uppercase" />
                <YAxis axisLine={false} tickLine={false} className="text-[10px] font-black uppercase" />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.15)', background: 'black', color: 'white' }}
                />
                <Area type="monotone" dataKey="ms" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl bg-black text-white rounded-[3rem] p-10">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-8">Hardware Virtual</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black uppercase">CPU Load</span>
                  </div>
                  <span className="text-sm font-black">24%</span>
                </div>
                <Progress value={24} className="h-1.5 bg-white/10 [&>div]:bg-primary" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" />
                    <span className="text-xs font-black uppercase">Memory Usage</span>
                  </div>
                  <span className="text-sm font-black">1.2 GB / 4 GB</span>
                </div>
                <Progress value={30} className="h-1.5 bg-white/10 [&>div]:bg-accent" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-black uppercase">Task Queue</span>
                  </div>
                  <span className="text-sm font-black">0 Pending</span>
                </div>
                <Progress value={0} className="h-1.5 bg-white/10 [&>div]:bg-orange-500" />
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Service Status</h3>
            <div className="space-y-4">
              <ServiceStatusItem name="Firebase Auth" status="online" />
              <ServiceStatusItem name="Firestore DB" status="online" />
              <ServiceStatusItem name="Gemini API" status="online" />
              <ServiceStatusItem name="Resend Mail" status="online" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function HealthMetricCard({ title, value, status, icon }: { title: string, value: string, status: string, icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{title}</CardTitle>
        <div className="p-2.5 rounded-2xl bg-muted/30">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="text-3xl font-headline font-black tracking-tight">{value}</div>
        <Badge variant="outline" className="mt-2 text-[8px] font-black uppercase border-green-500/20 text-green-500 bg-green-500/5">
          {status}
        </Badge>
      </CardContent>
    </Card>
  )
}

function ServiceStatusItem({ name, status }: { name: string, status: 'online' | 'degraded' | 'offline' }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
      <span className="text-xs font-bold">{name}</span>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} />
        <span className="text-[10px] font-black uppercase opacity-60">{status}</span>
      </div>
    </div>
  )
}
