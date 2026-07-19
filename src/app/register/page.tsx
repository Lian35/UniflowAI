
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  User as UserIcon,
  ShieldAlert,
  Sparkles
} from "lucide-react"
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { sendOTPEmail } from "@/ai/flows/auth-email-flow"

type RegisterStep = "FORM" | "VERIFY" | "SUCCESS"

export default function RegisterPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()

  const [step, setStep] = useState<RegisterStep>("FORM")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otpInput, setOtpInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userIdState, setUserId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Perfil del usuario actual para detección de estado de verificación
  const profileRef = useMemoFirebase(() => {
    if (!user) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  const { data: profile } = useDoc(profileRef)

  // Efecto: Redirigir si el usuario ya está verificado o saltar a VERIFY si está logueado pero no verificado
  useEffect(() => {
    if (user && profile) {
      if (profile.verified) {
        router.push("/dashboard")
      } else if (step === "FORM") {
        setStep("VERIFY")
        setUserId(user.uid)
        setEmail(user.email || "")
        setName(profile.firstName || "Estudiante")
      }
    }
  }, [user, profile, step, router])

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast({ title: "Contraseña débil", description: "Mínimo 8 caracteres por seguridad.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const newUser = userCredential.user
      setUserId(newUser.uid)

      await updateProfile(newUser, { displayName: name })

      const otp = generateOTP()
      const expiration = new Date()
      expiration.setMinutes(expiration.getMinutes() + 10)

      await setDoc(doc(db, "users", newUser.uid), {
        id: newUser.uid,
        email: newUser.email?.toLowerCase(),
        firstName: name,
        verified: false,
        otpCode: otp,
        otpExpiration: expiration.toISOString(),
        otpAttempts: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        accountStatus: "pending_verification"
      })

      await setDoc(doc(db, "users", newUser.uid, "settings", "user_settings"), {
        id: "user_settings",
        userId: newUser.uid,
        darkModeEnabled: false,
        aiLearningLevel: "intermediate",
        updatedAt: serverTimestamp(),
      })

      // Envío de correo mediante Genkit Flow
      const emailResult = await sendOTPEmail({ email, userName: name, otpCode: otp })
      
      if (emailResult.success) {
        toast({ 
          title: "Correo enviado", 
          description: "Revisa tu bandeja de entrada (y la carpeta de spam).",
        })
      } else {
        console.warn(emailResult.error)
        toast({ 
          title: "Código generado", 
          description: `El código es ${otp}. Úsalo para activar tu cuenta ya que el envío por email está en modo manual.`,
          duration: 15000 
        })
      }

      setStep("VERIFY")
      setCountdown(60)
    } catch (error: any) {
      toast({
        title: "No se pudo crear la cuenta",
        description: error.message || "Error al procesar el registro.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    const currentUserId = userIdState || user?.uid
    if (!currentUserId || otpInput.length !== 6) return
    
    setIsLoading(true)
    try {
      const userRef = doc(db, "users", currentUserId)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const data = userSnap.data()
        
        if ((data.otpAttempts || 0) >= 5) {
          toast({ title: "Cuenta bloqueada", description: "Demasiados intentos. Contacta a soporte.", variant: "destructive" })
          return
        }

        const isExpired = new Date(data.otpExpiration) < new Date()
        if (isExpired) {
          toast({ title: "Código caducado", description: "Solicita un nuevo código.", variant: "destructive" })
          return
        }

        if (data.otpCode === otpInput) {
          await setDoc(userRef, {
            verified: true,
            otpCode: null,
            otpExpiration: null,
            accountStatus: "active",
            verifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true })
          
          setStep("SUCCESS")
        } else {
          const newAttempts = (data.otpAttempts || 0) + 1
          updateDocumentNonBlocking(userRef, { otpAttempts: newAttempts })
          toast({ title: "Código inválido", description: `Te quedan ${5 - newAttempts} intentos.`, variant: "destructive" })
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    const currentUserId = userIdState || user?.uid
    if (!currentUserId || countdown > 0) return
    
    setIsLoading(true)
    try {
      const otp = generateOTP()
      const expiration = new Date()
      expiration.setMinutes(expiration.getMinutes() + 10)

      updateDocumentNonBlocking(doc(db, "users", currentUserId), {
        otpCode: otp,
        otpExpiration: expiration.toISOString(),
        otpAttempts: 0,
        updatedAt: serverTimestamp()
      })

      const emailResult = await sendOTPEmail({ email: email || user?.email || "", userName: name, otpCode: otp })
      
      if (emailResult.success) {
        toast({ title: "Nuevo código enviado", description: "Revisa tu email nuevamente." })
      } else {
        toast({ 
          title: "NUEVO CÓDIGO GENERADO", 
          description: `Tu nuevo código es ${otp}.`,
          duration: 10000 
        })
      }
      
      setCountdown(60)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-background px-4">
      {step === "FORM" && (
        <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-white dark:bg-card rounded-2xl shadow-xl shadow-primary/5 mb-4 border border-border/50">
              <Zap className="h-8 w-8 text-primary fill-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold tracking-tight">Comienza ahora</h1>
            <p className="text-muted-foreground font-medium">Únete a la nueva era del aprendizaje inteligente.</p>
          </div>

          <Card className="border-none shadow-2xl shadow-primary/5 bg-white dark:bg-card rounded-[2rem] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
            <CardContent className="pt-8 space-y-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo</Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="name" 
                      placeholder="Ej: Julian Casablancas" 
                      required 
                      className="h-12 pl-11 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl font-medium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Universitario</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="nombre@universidad.edu" 
                      required 
                      className="h-12 pl-11 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Contraseña</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Mínimo 8 caracteres"
                      required 
                      className="h-12 pl-11 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold shadow-xl shadow-primary/20 rounded-xl bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear mi cuenta gratuita"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="pb-8 flex flex-col gap-4">
              <div className="text-sm text-center text-muted-foreground font-medium">
                ¿Ya eres parte?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">Inicia sesión aquí</Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {step === "VERIFY" && (
        <div className="w-full max-w-[440px] space-y-8 animate-in slide-in-from-right duration-500">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-accent/10 rounded-[2rem] text-accent mb-2">
              <Mail className="h-10 w-10 animate-bounce" />
            </div>
            <h1 className="text-3xl font-headline font-bold">Verifica tu correo</h1>
            <p className="text-muted-foreground font-medium px-8">
              Ingresa el código enviado a <span className="text-foreground font-bold">{email || user?.email}</span>
            </p>
          </div>

          <Card className="border-none shadow-2xl shadow-accent/5 bg-white dark:bg-card rounded-[2.5rem]">
            <CardContent className="pt-10 space-y-8">
              <div className="space-y-4">
                <Label className="text-center block text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Código de Activación</Label>
                <div className="relative">
                  <Input 
                    className="text-center text-4xl font-bold tracking-[0.8em] h-20 bg-muted/20 border-none focus-visible:ring-4 focus-visible:ring-accent/10 rounded-2xl placeholder:opacity-20"
                    maxLength={6}
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Button 
                  className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 shadow-2xl shadow-accent/20 rounded-2xl transition-all"
                  onClick={handleVerify}
                  disabled={isLoading || otpInput.length !== 6}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verificar y Activar"}
                </Button>
                
                <button 
                  onClick={handleResend}
                  disabled={isLoading || countdown > 0}
                  className="w-full text-sm text-muted-foreground hover:text-accent font-bold transition-colors disabled:opacity-40"
                >
                  {countdown > 0 ? `Reenviar código en ${countdown}s` : "Solicitar nuevo código"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "SUCCESS" && (
        <div className="w-full max-w-[480px] text-center p-8 animate-in zoom-in duration-700">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative bg-white dark:bg-card p-8 rounded-[3rem] shadow-2xl inline-block border-4 border-green-500/10">
              <CheckCircle2 className="h-20 w-20 text-green-500" />
            </div>
          </div>
          <h1 className="text-5xl font-headline font-black tracking-tighter mb-4">¡Todo listo!</h1>
          <p className="text-xl text-muted-foreground font-medium mb-10">Tu cuenta ha sido activada con éxito.</p>
          <Button 
            className="w-full h-16 text-xl font-black gap-3 group bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 rounded-[2rem] transition-all" 
            onClick={() => router.push("/dashboard")}
          >
            Entrar al Ecosistema
            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  )
}
