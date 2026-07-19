
"use client"

import { useUser } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Github, 
  Rocket, 
  Terminal, 
  ExternalLink, 
  CheckCircle2, 
  Info,
  GitBranch,
  CloudUpload,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DeploymentPage() {
  const { user } = useUser()
  const router = useRouter()
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  // Guardia de Seguridad Super Admin
  useEffect(() => {
    if (user && user.email !== 'fg664714@gmail.com') {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopyStatus(id)
    setTimeout(() => setCopyStatus(null), 2000)
  }

  if (!user || user.email !== 'fg664714@gmail.com') return null

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-black rounded-2xl text-white shadow-xl shadow-black/10">
              <Github className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-headline font-black uppercase tracking-tight">Terminal de Despliegue</h1>
          </div>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-1 ml-1">Sincronización con GitHub & Firebase App Hosting</p>
        </div>
        <Badge className="bg-green-500 font-black uppercase tracking-widest h-10 px-4 flex items-center border-none">CI/CD: READY</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl bg-white dark:bg-card rounded-[3rem] overflow-hidden">
            <CardHeader className="p-10 border-b bg-muted/10">
              <CardTitle className="font-headline font-black uppercase flex items-center gap-3 text-xl">
                <Terminal className="h-6 w-6 text-primary" /> Paso a Paso: Subir a GitHub
              </CardTitle>
              <CardDescription className="font-bold">Ejecuta estos comandos en tu terminal local para vincular el código.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <StepItem 
                num="01" 
                title="Inicializar Repositorio" 
                desc="Prepara el proyecto localmente para el control de versiones."
                cmd="git init"
                onCopy={() => handleCopy("git init", "s1")}
                isCopied={copyStatus === "s1"}
              />
              <StepItem 
                num="02" 
                title="Añadir Cambios" 
                desc="Agrega todos los archivos del ecosistema UniFlow al área de preparación."
                cmd="git add ."
                onCopy={() => handleCopy("git add .", "s2")}
                isCopied={copyStatus === "s2"}
              />
              <StepItem 
                num="03" 
                title="Primer Commit" 
                desc="Crea un punto de restauración con la identidad visual actual."
                cmd='git commit -m "feat: setup UniFlow AI Master Edition"'
                onCopy={() => handleCopy('git commit -m "feat: setup UniFlow AI Master Edition"', "s3")}
                isCopied={copyStatus === "s3"}
              />
              <StepItem 
                num="04" 
                title="Vincular con GitHub" 
                desc="Sustituye la URL por la de tu nuevo repositorio en GitHub."
                cmd="git remote add origin https://github.com/TU_USUARIO/TU_REPO.git"
                onCopy={() => handleCopy("git remote add origin https://github.com/TU_USUARIO/TU_REPO.git", "s4")}
                isCopied={copyStatus === "s4"}
              />
              <StepItem 
                num="05" 
                title="Push Maestro" 
                desc="Sube el código a la rama principal para activar App Hosting."
                cmd="git push -u origin main"
                onCopy={() => handleCopy("git push -u origin main", "s5")}
                isCopied={copyStatus === "s5"}
              />
            </CardContent>
          </Card>

          {/* Nueva Sección: Resolución de Problemas */}
          <Card className="border-none shadow-2xl bg-destructive/5 rounded-[3rem] overflow-hidden border border-destructive/10">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="font-headline font-black uppercase flex items-center gap-3 text-destructive text-lg">
                <AlertTriangle className="h-6 w-6" /> Error: Repository Not Found
              </CardTitle>
              <CardDescription className="font-bold text-destructive/70">Si ves este error en el IDE, es porque la conexión remota está mal configurada.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-6">
              <p className="text-sm font-medium leading-relaxed">
                Este error suele ocurrir si intentaste sincronizar antes de crear el repositorio en la web de GitHub o si hay un error en la URL de "origin". 
                Ejecuta estos dos comandos para **resetear la conexión**:
              </p>
              
              <div className="space-y-4">
                <div className="relative group/code">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 ml-1">1. Eliminar conexión actual:</p>
                  <code className="block p-4 bg-black text-destructive rounded-xl text-[11px] font-mono shadow-inner border border-white/10">
                    <span className="opacity-50 mr-2">$</span>git remote remove origin
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute right-2 top-8 h-8 text-[10px] font-black uppercase text-white hover:bg-white/10"
                    onClick={() => handleCopy("git remote remove origin", "err1")}
                  >
                    {copyStatus === "err1" ? "Copiado" : "Copiar"}
                  </Button>
                </div>

                <div className="relative group/code">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 ml-1">2. Vincular URL correcta (Asegúrate de crear el repo en GitHub primero):</p>
                  <code className="block p-4 bg-black text-green-400 rounded-xl text-[11px] font-mono shadow-inner border border-white/10">
                    <span className="opacity-50 mr-2">$</span>git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute right-2 top-8 h-8 text-[10px] font-black uppercase text-white hover:bg-white/10"
                    onClick={() => handleCopy("git remote add origin https://github.com/TU_USUARIO/TU_REPO.git", "err2")}
                  >
                    {copyStatus === "err2" ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-2xl bg-primary text-white rounded-[3rem] p-10 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-20 rotate-12 bg-white h-40 w-40 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <Rocket className="h-6 w-6" />
                <h3 className="text-xs font-black uppercase tracking-[0.4em]">App Hosting</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed opacity-90">
                Una vez que tu código esté en GitHub, ve a la consola de Firebase para conectar el repositorio y disfrutar de despliegues automáticos cada vez que hagas "Push".
              </p>
              <Button 
                variant="outline" 
                className="w-full h-14 bg-white/10 border-white/20 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/20 transition-all"
                onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
              >
                Abrir Consola Firebase <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-xl bg-white dark:bg-card rounded-[2.5rem] p-10 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Estado de Git</h3>
            </div>
            <div className="space-y-4">
              <StatusBadge icon={<GitBranch className="h-3 w-3" />} label="Rama" value="main" color="blue" />
              <StatusBadge icon={<CloudUpload className="h-3 w-3" />} label="Remote" value="Check Remote" color="orange" />
              <StatusBadge icon={<CheckCircle2 className="h-3 w-3" />} label="Hosting" value="App Hosting v2" color="green" />
            </div>
            <div className="p-6 rounded-2xl bg-muted/20 border border-dashed text-center">
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">
                <Info className="h-3 w-3 inline mr-1" /> Nota: Si el error persiste, asegúrate de haber creado el repositorio en GitHub **antes** de intentar subir los cambios.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StepItem({ num, title, desc, cmd, onCopy, isCopied }: { num: string, title: string, desc: string, cmd: string, onCopy: () => void, isCopied: boolean }) {
  return (
    <div className="flex gap-6 group">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border-2 border-primary/20">{num}</div>
        <div className="flex-1 w-px bg-muted my-2 group-last:hidden" />
      </div>
      <div className="flex-1 space-y-3 pb-8">
        <div>
          <h4 className="font-headline font-black uppercase text-sm tracking-tight">{title}</h4>
          <p className="text-xs text-muted-foreground font-medium">{desc}</p>
        </div>
        <div className="relative group/code">
          <code className="block p-4 bg-black text-green-400 rounded-xl text-[11px] font-mono shadow-inner border border-white/10 overflow-x-auto whitespace-nowrap">
            <span className="opacity-50 mr-2">$</span>{cmd}
          </code>
          <Button 
            size="sm" 
            variant="ghost" 
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-[10px] font-black uppercase text-white hover:bg-white/10"
            onClick={onCopy}
          >
            {isCopied ? "¡Copiado!" : "Copiar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: 'blue' | 'orange' | 'green' }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-200",
    orange: "bg-orange-500/10 text-orange-600 border-orange-200",
    green: "bg-green-500/10 text-green-600 border-green-200"
  }
  
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/50">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-white dark:bg-muted/50 text-muted-foreground shadow-sm">{icon}</div>
        <span className="text-[10px] font-black uppercase text-muted-foreground">{label}</span>
      </div>
      <Badge variant="outline" className={`text-[9px] font-black uppercase border-none ${colors[color]}`}>{value}</Badge>
    </div>
  )
}
