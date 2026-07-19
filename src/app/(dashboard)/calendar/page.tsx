"use client"

import { useMemo, useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Clock, 
  Calendar as CalendarIcon, 
  MapPin, 
  User, 
  Info, 
  AlertCircle, 
  Sparkles,
  Zap,
  TrendingUp,
  BrainCircuit
} from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7 AM to 9 PM

export default function CalendarPage() {
  const { user } = useUser()
  const db = useFirestore()

  const subjectsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "subjects"), where("status", "==", "Current"))
  }, [user, db])

  const { data: subjects, isLoading } = useCollection<any>(subjectsQuery)

  const calendarData = useMemo(() => {
    const data: any = {}
    if (!subjects) return data

    subjects.forEach(subject => {
      if (subject.schedule) {
        subject.schedule.forEach((sch: any) => {
          const day = sch.day
          if (!data[day]) data[day] = []
          
          try {
            const startParts = sch.startTime.split(':')
            const endParts = sch.endTime.split(':')
            
            const startHour = parseInt(startParts[0])
            const startMin = parseInt(startParts[1])
            const endHour = parseInt(endParts[0])
            const endMin = parseInt(endParts[1])
            
            const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin)
            const topPosition = (startHour - 7) * 60 + startMin

            data[day].push({
              id: subject.id,
              name: subject.name,
              code: subject.code,
              professor: subject.professor || sch.professor,
              room: sch.room,
              startTime: sch.startTime,
              endTime: sch.endTime,
              top: topPosition,
              height: duration,
              color: subject.isBaseSubject ? 'bg-accent' : (subject.isRepeating ? 'bg-orange-500' : 'bg-primary')
            })
          } catch (e) {
            console.error("Error al procesar bloque horario:", sch)
          }
        })
      }
    })
    return data
  }, [subjects])

  // Análisis inteligente de la semana
  const dayStats = useMemo(() => {
    if (!calendarData) return []
    return DAYS.map(day => ({
      day,
      hours: (calendarData[day]?.reduce((acc: number, item: any) => acc + item.height, 0) || 0) / 60
    }))
  }, [calendarData])

  const busiestDay = useMemo(() => {
    if (dayStats.length === 0) return null
    return [...dayStats].sort((a, b) => b.hours - a.hours)[0]
  }, [dayStats])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative">
          <div className="h-16 w-16 animate-spin border-[6px] border-primary border-t-transparent rounded-full shadow-2xl shadow-primary/20" />
          <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-pulse" />
        </div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs animate-pulse">Sincronizando Agenda Cuántica...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-3xl text-primary"><CalendarIcon className="h-8 w-8" /></div>
            <h1 className="text-4xl font-headline font-black tracking-tight">Agenda Maestra</h1>
          </div>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest ml-1">Interpretación Inteligente de tu Tiempo</p>
        </div>
        <div className="flex gap-2">
          <Badge className="px-6 py-2 rounded-full border-none bg-primary text-white font-black uppercase tracking-widest text-[10px]">
            {subjects?.length || 0} Materias Activas
          </Badge>
          <Badge variant="outline" className="px-6 py-2 rounded-full border-2 border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-widest text-[10px]">
            Sincronizado vía AI
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white dark:bg-card">
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <div className="min-w-[1000px] flex flex-col h-full">
                  {/* Day Headers */}
                  <div className="grid grid-cols-8 border-b bg-muted/20">
                    <div className="p-6 border-r flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {DAYS.map(day => (
                      <div key={day} className="p-6 text-center border-r last:border-none">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">{day}</span>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div className="grid grid-cols-8 relative h-[900px]">
                    {/* Hour Column */}
                    <div className="flex flex-col border-r bg-muted/5">
                      {HOURS.map(hour => (
                        <div key={hour} className="h-[60px] flex items-start justify-center pt-2 border-b border-muted/30 last:border-none">
                          <span className="text-[9px] font-black text-muted-foreground/60">{hour}:00</span>
                        </div>
                      ))}
                    </div>

                    {/* Day Columns */}
                    {DAYS.map(day => (
                      <div key={day} className="relative border-r border-muted/30 last:border-none group hover:bg-muted/10 transition-colors">
                        {HOURS.map(hour => (
                          <div key={hour} className="h-[60px] border-b border-muted/30 last:border-none" />
                        ))}

                        {calendarData[day]?.map((item: any, idx: number) => (
                          <div 
                            key={`${item.id}-${idx}`}
                            className={cn(
                              "absolute left-1 right-1 rounded-3xl p-4 shadow-2xl border border-white/20 text-white overflow-hidden transition-all hover:scale-[1.03] hover:z-20 group/item cursor-default",
                              item.color
                            )}
                            style={{ top: `${item.top}px`, height: `${item.height}px` }}
                          >
                            <div className="flex flex-col h-full justify-between relative z-10">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{item.startTime} - {item.endTime}</p>
                                  {item.room && <Badge className="bg-white/20 text-[8px] border-none font-bold">{item.room}</Badge>}
                                </div>
                                <h4 className="text-xs font-black leading-tight group-hover/item:underline">{item.name}</h4>
                              </div>
                              <div className="flex items-center gap-2 mt-2 opacity-80">
                                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center"><User className="h-2.5 w-2.5" /></div>
                                <span className="text-[8px] font-black uppercase truncate">{item.professor || 'Docente'}</span>
                              </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 opacity-10 group-hover/item:opacity-20 transition-opacity">
                              <CalendarIcon className="h-16 w-16 rotate-12" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-black text-white rounded-[3rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12"><BrainCircuit className="h-24 w-24" /></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Análisis de Tiempo</h3>
              {busiestDay && busiestDay.hours > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">Día de mayor carga</p>
                    <p className="text-xl font-headline font-black">{busiestDay.day}</p>
                    <p className="text-xs font-bold text-primary mt-1">{busiestDay.hours.toFixed(1)}h de clase</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase tracking-wider">
                      <Zap className="h-3 w-3 inline mr-1 text-yellow-500" /> 
                      Tip de IA: El {busiestDay.day} tienes alta carga mental. No agendes sesiones de estudio de más de 45 min este día.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs font-bold text-white/40 uppercase">Sube tu horario para ver analíticas</p>
              )}
            </div>
          </Card>

          <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2.5rem] p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Distribución Semanal
            </h3>
            <div className="space-y-4">
              {dayStats.map((stat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span>{stat.day}</span>
                    <span className="text-primary">{stat.hours.toFixed(1)}h</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(stat.hours / 10) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 border-dashed">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase">
                Los bloques se sincronizan automáticamente desde la sección de **Malla & Materias**. Cualquier cambio allá se reflejará aquí al instante.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
