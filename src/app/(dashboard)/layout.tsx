
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { UserNav } from "@/components/user-nav"
import { Toaster } from "@/components/ui/toaster"
import { Loader2, Lock, Mail, ArrowRight, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const profileRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef)

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login")
    }
  }, [user, isUserLoading, router])

  if (isUserLoading || (user && !user.isAnonymous && isProfileLoading)) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#F9FAFB] dark:bg-background">
        <div className="flex flex-col items-center gap-8 animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse scale-150" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-foreground font-headline font-bold text-xl tracking-tight">UniFlow Master</p>
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold animate-pulse">Sincronizando Ecosistema...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Guardia de Verificación Profesional (Solo para usuarios registrados, no anónimos)
  if (!user.isAnonymous && profile && !profile.verified) {
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-background p-6 overflow-hidden">
        <div className="max-w-[440px] w-full text-center space-y-8 animate-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/10 blur-3xl rounded-full scale-150" />
            <div className="bg-white dark:bg-card p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-destructive/5 inline-block relative z-10">
              <Lock className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight">Acceso Restringido</h2>
            <p className="text-muted-foreground font-medium px-4 text-base md:text-lg leading-relaxed">
              Tu identidad académica aún no ha sido confirmada. Verifica tu correo para desbloquear el ecosistema Pro.
            </p>
          </div>

          <div className="bg-white dark:bg-card p-5 rounded-3xl shadow-xl border border-border/50 flex items-center gap-4 text-left">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground/80 leading-none mb-1">Verificación Pendiente</p>
              <p className="text-xs text-muted-foreground font-medium truncate">Revisa tu bandeja de entrada o spam.</p>
            </div>
          </div>

          <Button 
            className="w-full h-14 md:h-16 font-black text-lg md:text-xl gap-3 shadow-2xl shadow-primary/20 rounded-2xl md:rounded-[2rem] bg-primary hover:bg-primary/90 transition-all active:scale-95 group" 
            onClick={() => router.push("/register")}
          >
            Completar Activación
            <ArrowRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-2 transition-transform" />
          </Button>
          
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
            Seguridad Pro Activa
          </p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-[#F9FAFB] dark:bg-background font-body overflow-x-hidden">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col bg-transparent border-none">
          {user.isAnonymous && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-3">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                Modo Demo Activo: Las funciones de guardado están limitadas a observación y prueba temporal.
              </span>
              <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase text-amber-700 underline" onClick={() => router.push('/register')}>
                Registrar cuenta Pro
              </Button>
            </div>
          )}
          <header className="sticky top-0 z-30 flex h-16 md:h-20 shrink-0 items-center gap-2 border-b bg-white/60 dark:bg-background/60 px-4 md:px-8 backdrop-blur-xl">
            <SidebarTrigger className="-ml-1 h-10 w-10 hover:bg-primary/5 rounded-xl transition-colors" />
            <div className="flex-1" />
            <UserNav />
          </header>
          <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
