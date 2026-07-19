
"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useAuth, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Save, User, Bell, Brain, Loader2, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  
  const profileRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const settingsRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid, "settings", "user_settings")
  }, [user, db])

  const { data: profileData, isLoading: profileLoading } = useDoc(profileRef)
  const { data: settingsData, isLoading: settingsLoading } = useDoc(settingsRef)
  
  const [firstName, setFirstName] = useState("")
  const [localSettings, setLocalSettings] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profileData) {
      setFirstName(profileData.firstName || user?.displayName || "")
    }
  }, [profileData, user])

  useEffect(() => {
    if (settingsData) {
      setLocalSettings(settingsData)
    }
  }, [settingsData])

  const handleSave = () => {
    if (!user || !localSettings || !firstName.trim()) return

    setIsSaving(true)
    
    // Sincronizamos Auth Profile (opcional, no bloqueante)
    if (auth.currentUser) {
      updateProfile(auth.currentUser, { displayName: firstName })
    }

    // Actualizamos Firestore de forma no bloqueante
    updateDocumentNonBlocking(doc(db, "users", user.uid), {
      firstName: firstName,
      updatedAt: serverTimestamp()
    })

    updateDocumentNonBlocking(doc(db, "users", user.uid, "settings", "user_settings"), {
      ...localSettings,
      updatedAt: serverTimestamp()
    })

    toast({ 
      title: "Cambios en proceso", 
      description: "Tus preferencias se están sincronizando en segundo plano." 
    })
    
    setTimeout(() => setIsSaving(false), 800)
  }

  if (profileLoading || settingsLoading || !localSettings) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-headline animate-pulse">Sincronizando preferencias...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-headline font-bold">Configuración del Ecosistema</h1>
        <p className="text-muted-foreground">Personaliza tu identidad y cómo interactúa la IA contigo</p>
      </div>

      <div className="grid gap-8">
        <Card className="border-none shadow-xl bg-white dark:bg-card overflow-hidden">
          <div className="h-2 w-full bg-primary" />
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Perfil de Usuario
            </CardTitle>
            <CardDescription>Información básica de tu cuenta universitaria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-muted">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-white">
                    {firstName.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-1 text-center md:text-left">
                <h3 className="text-lg font-bold">{firstName || "Estudiante UniFlow"}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-[10px] uppercase font-bold tracking-widest text-primary mt-2">ID: {user?.uid.substring(0, 8)}...</p>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-bold">Nombre Completo</Label>
                <Input 
                  id="firstName" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-muted-foreground">Correo Electrónico (No editable)</Label>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white dark:bg-card">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" /> Inteligencia Adaptativa
            </CardTitle>
            <CardDescription>Configura el nivel de complejidad de las explicaciones de la IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="font-bold">Nivel de Comprensión Académica</Label>
              <Select 
                value={localSettings.aiLearningLevel} 
                onValueChange={(val) => setLocalSettings({...localSettings, aiLearningLevel: val})}
              >
                <SelectTrigger className="w-full md:max-w-md bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante (Conceptos base y analogías simples)</SelectItem>
                  <SelectItem value="intermediate">Intermedio (Nivel universitario estándar)</SelectItem>
                  <SelectItem value="advanced">Avanzado (Enfoque técnico y rigor académico)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-dashed">
              <div className="space-y-1">
                <Label className="font-bold">Personalización de Interfaz</Label>
                <p className="text-xs text-muted-foreground">Activa el modo oscuro para sesiones de estudio nocturnas.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-tighter opacity-60">Modo Oscuro</span>
                <Switch 
                  checked={localSettings.darkModeEnabled} 
                  onCheckedChange={(val) => setLocalSettings({...localSettings, darkModeEnabled: val})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/20 sticky bottom-6 backdrop-blur-md z-20">
          <Button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full md:w-auto gap-2 font-bold px-12 h-12 shadow-xl shadow-primary/20 text-lg transition-all hover:scale-105"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
