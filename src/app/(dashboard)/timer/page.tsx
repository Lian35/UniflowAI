
"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, RotateCcw, Coffee, Brain, Trophy, History, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TimerPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'study' | 'break'>('study')
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  const totalSeconds = mode === 'study' ? 25 * 60 : 5 * 60
  const remainingSeconds = minutes * 60 + seconds
  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100

  const toggleTimer = () => setIsActive(!isActive)

  const resetTimer = useCallback(() => {
    setIsActive(false)
    setMinutes(mode === 'study' ? 25 : 5)
    setSeconds(0)
  }, [mode])

  const saveSession = useCallback((duration: number) => {
    if (!user || !db) return

    addDocumentNonBlocking(collection(db, "users", user.uid, "studySessions"), {
      userId: user.uid,
      durationMinutes: duration,
      status: "Completed",
      startTime: serverTimestamp(),
      endTime: serverTimestamp(),
      createdAt: serverTimestamp()
    })

    addDocumentNonBlocking(collection(db, "users", user.uid, "notifications"), {
      type: "ENFOQUE",
      message: `¡Sesión de ${duration}m finalizada! Tu racha está aumentando.`,
      isRead: false,
      createdAt: serverTimestamp()
    })
  }, [user, db])

  useEffect(() => {
    let interval: any = null
    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          setMinutes(minutes - 1)
          setSeconds(59)
        } else {
          setSeconds(seconds - 1)
        }
      }, 1000)
    } else if (isActive && minutes === 0 && seconds === 0) {
      setIsActive(false)
      if (mode === 'study') {
        const studyDuration = 25
        setSessionsCompleted(prev => prev + 1)
        saveSession(studyDuration)
        setMode('break')
        setMinutes(5)
        toast({
          title: "¡Sesión completada!",
          description: "Has ganado 25 minutos de enfoque. Tómate un respiro.",
        })
      } else {
        setMode('study')
        setMinutes(25)
        toast({
          title: "¡Tiempo de volver!",
          description: "Tu descanso ha terminado. ¡A por ello!",
        })
      }
      
      if (typeof window !== 'undefined') {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3")
        audio.play().catch(() => {})
      }
    }
    return () => clearInterval(interval)
  }, [isActive, minutes, seconds, mode, saveSession, toast])

  return (
    <div className="space-y-8 animate-in zoom-in duration-500 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold text-foreground">Zona de Enfoque</h1>
        <p className="text-muted-foreground text-lg">Maximiza tu productividad con bloques controlados</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col justify-center">
            <div className={`absolute inset-0 opacity-[0.03] transition-colors duration-1000 ${mode === 'study' ? 'bg-primary' : 'bg-green-500'}`} />
            <CardContent className="p-12 flex flex-col items-center justify-center relative z-10">
              <div className="flex gap-4 mb-12 bg-muted/30 p-1.5 rounded-full">
                <Button 
                  variant={mode === 'study' ? 'default' : 'ghost'} 
                  onClick={() => { setMode('study'); resetTimer(); }}
                  className="rounded-full px-8 h-10 font-bold"
                >
                  <Brain className="mr-2 h-4 w-4" /> Estudio
                </Button>
                <Button 
                  variant={mode === 'break' ? 'default' : 'ghost'} 
                  onClick={() => { setMode('break'); resetTimer(); }}
                  className="rounded-full px-8 h-10 font-bold"
                >
                  <Coffee className="mr-2 h-4 w-4" /> Descanso
                </Button>
              </div>

              <div className={`text-9xl md:text-[10rem] font-headline font-bold tracking-tighter tabular-nums mb-8 transition-all duration-300 ${isActive ? 'scale-105' : 'scale-100'} ${mode === 'study' ? 'text-primary' : 'text-green-500'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>

              <div className="w-full max-w-md space-y-3 mb-12">
                <Progress value={progress} className={`h-2.5 ${mode === 'break' ? 'bg-green-100 dark:bg-green-950 [&>div]:bg-green-500' : ''}`} />
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Inicio</span>
                  <span className="text-foreground">{mode === 'study' ? 'Sesión de Enfoque' : 'Descanso Activo'}</span>
                  <span>Meta</span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-14 w-14 rounded-full border-2 hover:bg-muted"
                  onClick={resetTimer}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button 
                  size="icon" 
                  className={`h-24 w-24 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${isActive ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20' : 'bg-primary shadow-primary/30'}`}
                  onClick={toggleTimer}
                >
                  {isActive ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                </Button>
                <div className="h-14 w-14" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-white dark:bg-card">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Progreso Diario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">Sesiones Completadas</span>
                <span className="text-4xl font-headline font-bold text-primary">{sessionsCompleted} <span className="text-lg text-muted-foreground">/ 8</span></span>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <History className="h-4 w-4" /> Actividad Reciente
                </h4>
                <div className="space-y-2">
                  {sessionsCompleted > 0 ? (
                    Array.from({ length: sessionsCompleted }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-3 bg-muted/30 rounded-xl border border-dashed">
                        <span className="font-bold">Sesión #{i + 1}</span>
                        <span className="text-primary font-bold">+25 min</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-4">Inicia tu primera sesión del día</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-accent to-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 fill-white" /> Tip de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-90 leading-relaxed font-medium">
                Has completado {sessionsCompleted} sesiones. Tu nivel de enfoque actual es óptimo. Si llegas a 4 sesiones seguidas, te recomendamos un descanso largo de 15 minutos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
