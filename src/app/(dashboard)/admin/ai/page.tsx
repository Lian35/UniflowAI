
"use client"

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase"
import { collection, query, orderBy, limit, doc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { 
  Brain, 
  Activity, 
  Database, 
  Zap, 
  MessageSquare, 
  Settings2, 
  ShieldAlert,
  Loader2,
  AlertCircle,
  Save,
  Terminal,
  History
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function AIMonitorPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  // Guardia de Seguridad
  useEffect(() => {
    if (user && user.email !== 'fg664714@gmail.com') {
      router.push("/dashboard")
    }
  }, [user, router])

  // Datos de Interacciones
  const interactionsQuery = useMemoFirebase(() => query(collection(db, "system_ai_interactions"), orderBy("timestamp", "desc"), limit(20)), [db])
  const { data: interactions, isLoading: loadingInteractions } = useCollection(interactionsQuery)

  // Datos de Configuración Global
  const configRef = useMemoFirebase(() => doc(db, "system_settings", "ai_config"), [db])
  const { data: globalConfig, isLoading: loadingConfig } = useDoc(configRef)

  const [localConfig, setLocalConfig] = useState({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 2048,
    model: "gemini-2.5-flash"
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (globalConfig) {
      setLocalConfig({
        temperature: globalConfig.temperature ?? 0.7,
        topP: globalConfig.topP ?? 0.9,
        maxTokens: globalConfig.maxTokens ?? 2048,
        model: globalConfig.model ?? "gemini-2.5-flash"
      })
    }
  }, [globalConfig])

  const handleSaveConfig = () => {
    setIsSaving(true)
    setDocumentNonBlocking(doc(db, "system_settings", "ai_config"), {
      ...localConfig,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid
    }, { merge: true })
    
    toast({ title: "Motor actualizado", description: "Los parámetros de Gemini han sido sincronizados globalmente." })
    setTimeout(() => setIsSaving(false), 1000)
  }

  if (!user || user.email !== 'fg664714@gmail.com') return null

  return (
    <div className="space-y-8 animate-in zoom-in duration-700 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent rounded-2xl text-white shadow-xl shadow-accent/20">
              <Terminal className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-headline font-black uppercase tracking-tight">Monitor de Inteligencia</h1>
          </div>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-1 ml-1">Telemetría de Gemini Pro Master Core</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-500 font-black uppercase tracking-widest h-10 px-4 flex items-center border-none">Engine: Active</Badge>
          <Badge variant="outline" className="font-black uppercase tracking-widest h-10 px-4 flex items-center border-2 bg-white dark:bg-card">Status: Healthy</Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Columna Principal: Interacciones */}
        <Card className="lg:col-span-2 border-none shadow-2xl bg-white dark:bg-card rounded-[3rem] overflow-hidden">
          <CardHeader className="p-10 border-b bg-muted/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline font-black uppercase flex items-center gap-3 text-xl">
                  <MessageSquare className="h-6 w-6 text-accent" /> Tráfico en Tiempo Real
                </CardTitle>
                <CardDescription className="font-bold">Análisis de consultas y calidad de inferencia</CardDescription>
              </div>
              <Badge variant="outline" className="font-black h-8 px-4 rounded-xl border-2">
                {interactions?.length || 0} Sesiones Recientes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {loadingInteractions ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-accent" />
                  <p className="text-xs font-black uppercase tracking-widest opacity-40">Sincronizando flujo de datos...</p>
                </div>
              ) : interactions && interactions.length > 0 ? (
                interactions.map((it: any) => (
                  <div key={it.id} className="p-8 hover:bg-muted/30 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tighter">Usuario: {it.userName || it.userId?.substring(0, 8) || 'Anónimo'}</p>
                          <div className="flex items-center gap-2">
                            <History className="h-3 w-3 text-muted-foreground" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">
                              {it.timestamp?.seconds ? format(new Date(it.timestamp.seconds * 1000), "HH:mm:ss '•' d MMM", { locale: es }) : 'Ahora'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-black uppercase px-3 py-1 bg-muted/50 border-none group-hover:bg-accent group-hover:text-white transition-colors">
                        Model: {it.type || 'v2.5-flash'}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="p-5 rounded-[1.5rem] bg-muted/20 border-l-4 border-primary">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Activity className="h-3 w-3" /> Input Query:
                        </p>
                        <p className="text-sm font-medium italic text-foreground/80 leading-relaxed">"{it.question || 'Sin texto (adjunto visual)'}"</p>
                      </div>
                      <div className="p-5 rounded-[1.5rem] bg-accent/5 border-l-4 border-accent">
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Zap className="h-3 w-3" /> Output Inferencia:
                        </p>
                        <p className="text-sm line-clamp-3 opacity-80 leading-relaxed">{it.answer}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center opacity-30">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-xs">Sin interacciones registradas en el periodo actual</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Columna Lateral: Configuración y Conocimiento */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-black text-white rounded-[3rem] p-10 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 opacity-10 rotate-12 bg-accent h-40 w-40 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-accent">Configuración del Cerebro</h3>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60">Temperatura</label>
                    <Badge variant="outline" className="bg-white/10 border-white/20 font-black">{localConfig.temperature}</Badge>
                  </div>
                  <Slider 
                    value={[localConfig.temperature]} 
                    min={0} max={1} step={0.1}
                    onValueChange={(v) => setLocalConfig({...localConfig, temperature: v[0]})}
                    className="[&>span:first-child]:bg-accent"
                  />
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Determina la creatividad vs precisión factual</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60">Top P</label>
                    <Badge variant="outline" className="bg-white/10 border-white/20 font-black">{localConfig.topP}</Badge>
                  </div>
                  <Slider 
                    value={[localConfig.topP]} 
                    min={0} max={1} step={0.05}
                    onValueChange={(v) => setLocalConfig({...localConfig, topP: v[0]})}
                    className="[&>span:first-child]:bg-accent"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-black uppercase tracking-widest opacity-60">Max Tokens</label>
                    <Badge variant="outline" className="bg-white/10 border-white/20 font-black">{localConfig.maxTokens}</Badge>
                  </div>
                  <Slider 
                    value={[localConfig.maxTokens]} 
                    min={256} max={4096} step={128}
                    onValueChange={(v) => setLocalConfig({...localConfig, maxTokens: v[0]})}
                    className="[&>span:first-child]:bg-accent"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveConfig}
                disabled={isSaving || loadingConfig}
                className="w-full h-14 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Save className="h-5 w-5 mr-2" /> Guardar Cambios
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2.5rem] p-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground mb-8">Ecosistema de Conocimiento</h3>
            <div className="space-y-4">
              <KnowledgeItem icon={<Database className="text-primary" />} title="Glosario STEM Master" detail="1,450 conceptos indexados" />
              <KnowledgeItem icon={<Database className="text-accent" />} title="Mallas Curriculares ITI" detail="35 universidades registradas" />
              <KnowledgeItem icon={<Database className="text-orange-500" />} title="Histórico de Exámenes" detail="2,100 ejercicios resueltos" />
            </div>
            <Button variant="outline" className="w-full mt-8 h-12 rounded-xl border-dashed border-2 font-bold text-xs uppercase hover:bg-muted/50 transition-all">
              + Alimentar Motor
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KnowledgeItem({ icon, title, detail }: { icon: React.ReactNode, title: string, detail: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-accent/20 transition-all cursor-pointer group">
      <div className="p-2 rounded-xl bg-white dark:bg-muted/50 shadow-sm transition-transform group-hover:scale-110">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black uppercase truncate">{title}</p>
        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">{detail}</p>
      </div>
      <Zap className="h-3 w-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
