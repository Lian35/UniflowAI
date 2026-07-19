
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Zap, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Brain, 
  Target, 
  Star, 
  Users, 
  Rocket, 
  TrendingUp,
  Loader2
} from "lucide-react"
import { useAuth } from "@/firebase"
import { signInAnonymously } from "firebase/auth"
import { PlaceHolderImages } from "@/lib/placeholder-images"

function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand_grad_main" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="100" height="100" rx="32" fill="url(#brand_grad_main)" />
      {/* Icono de Pulso Ascendente / S Estilizada */}
      <path 
        d="M30 65 C30 65 45 45 55 55 C65 65 80 35 80 35" 
        stroke="white" 
        strokeWidth="12" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      <circle cx="80" cy="35" r="6" fill="white" filter="url(#glow)" />
    </svg>
  )
}

export default function LandingPage() {
  const auth = useAuth()
  const router = useRouter()
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const aboutImage = PlaceHolderImages.find(img => img.id === "uniflow-about")

  const handleDemoAccess = async () => {
    setIsDemoLoading(true)
    try {
      await signInAnonymously(auth)
      router.push("/dashboard")
    } catch (error) {
      console.error("Demo access error:", error)
      setIsDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10 drop-shadow-xl" />
            <span className="font-headline font-black text-2xl tracking-tighter uppercase">UniFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Ecosistema</a>
            <a href="#about" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Arquitectura</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="font-bold">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button className="font-black shadow-2xl shadow-primary/20 brand-gradient border-none rounded-2xl h-12 text-white" asChild>
              <Link href="/register">Empezar Gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] bg-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="max-w-6xl mx-auto text-center space-y-12">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-xl border border-primary/10 text-xs font-black text-primary uppercase tracking-[0.2em] animate-in fade-in duration-1000">
            <Sparkles className="h-4 w-4" /> 
            Protocolo de Inteligencia v3.0 Activo
          </div>
          <h1 className="text-7xl md:text-[9.5rem] font-headline font-black leading-[1] text-foreground tracking-tighter">
            Domina tu carrera <br /> con <span className="inline-block text-brand-gradient py-2">Inteligencia</span>.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            UniFlow AI Pro es el cerebro central de tu vida universitaria. Malla curricular, horario maestro y tutoría STEM de élite en una sola terminal integrada.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Button size="lg" className="h-20 px-16 text-xl font-black shadow-2xl shadow-primary/30 brand-gradient border-none group rounded-3xl text-white" asChild>
              <Link href="/register" className="flex items-center gap-3">
                Acceder al Ecosistema
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              disabled={isDemoLoading}
              onClick={handleDemoAccess}
              className="h-20 px-16 text-xl font-bold bg-white rounded-3xl border-4 hover:bg-muted/50 transition-all gap-3"
            >
              {isDemoLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Ver Demo Master"}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-24">
            <h2 className="text-5xl md:text-6xl font-headline font-black tracking-tight uppercase">Ingeniería para el Estudiante</h2>
            <p className="text-muted-foreground text-xl font-medium">Módulos de alta precisión diseñados para el máximo rendimiento académico.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Brain className="h-8 w-8 text-primary" />}
              title="TutorIA Pro"
              description="Resolución multimodal de problemas STEM con precisión quirúrgica. Tu cerebro externo conectado 24/7."
            />
            <FeatureCard 
              icon={<Target className="h-8 w-8 text-accent" />}
              title="Cronos Master"
              description="Planificación dinámica que se ajusta a tus ritmos biológicos y plazos de entrega críticos."
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="SínteIA"
              description="Transformación de contenido denso en mapas de conceptos y esquemas jerárquicos de estudio rápido."
            />
            <FeatureCard 
              icon={<BookOpen className="h-8 w-8 text-primary" />}
              title="Control de Malla"
              description="Visión estratégica de tu carrera con cálculo automático de créditos ACD/16 y predicción de grado."
            />
            <FeatureCard 
              icon={<Clock className="h-8 w-8 text-accent" />}
              title="Deep Focus"
              description="Bloques de concentración extrema con analíticas de productividad profunda en tiempo real."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-8 w-8 text-accent" />}
              title="Predictor IA"
              description="Detección temprana de riesgo académico y sugerencias de recuperación proactivas."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-[#F8FAFC] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="inline-block px-6 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.4em]">
                Arquitectura de Éxito
              </div>
              <h2 className="text-6xl font-headline font-black leading-[1] tracking-tight uppercase">
                Diseñado para el <br /> <span className="text-brand-gradient">1% académico</span>.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                Entendemos que la universidad no es solo estudiar, es gestionar recursos finitos: tiempo, energía y atención. UniFlow optimiza cada uno de ellos.
              </p>
              <div className="space-y-6">
                <div className="flex gap-6 items-start p-8 bg-white rounded-[2.5rem] shadow-xl border border-border/50 transition-all hover:shadow-2xl">
                  <div className="p-4 brand-gradient rounded-2xl text-white shadow-lg">
                    <Rocket className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-2xl mb-1 uppercase">Propulsión AI</h4>
                    <p className="text-sm text-muted-foreground font-medium">Algoritmos de aprendizaje adaptativo que evolucionan según tu rendimiento real.</p>
                  </div>
                </div>
                <div className="flex gap-6 items-start p-8 bg-white rounded-[2.5rem] shadow-xl border border-border/50 transition-all hover:shadow-2xl">
                  <div className="p-4 bg-accent rounded-2xl text-white shadow-lg">
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-2xl mb-1 uppercase">Ecosistema Abierto</h4>
                    <p className="text-sm text-muted-foreground font-medium">Integra tus notas, libros y horarios en un solo flujo de trabajo inteligente y coherente.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] transition-transform hover:scale-[1.02] duration-700 border-[12px] border-white relative z-10">
                <img 
                  src={aboutImage?.imageUrl || "https://picsum.photos/seed/uniflow-study-aesthetic/800/1000"} 
                  alt={aboutImage?.description || "Estética de estudio"} 
                  className="object-cover w-full h-full"
                  data-ai-hint="study aesthetic"
                />
              </div>
              <div className="absolute -bottom-12 -left-12 bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-primary/5 animate-float z-20">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl brand-gradient flex items-center justify-center text-white shadow-xl shadow-primary/20">
                    <Star className="h-8 w-8 fill-white" />
                  </div>
                  <div>
                    <p className="font-black text-3xl">4.9/5</p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">User Rating</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-64 h-64 brand-gradient rounded-full blur-[100px] opacity-20 -z-10" />
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 px-6 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-8 w-8" />
            <span className="font-headline font-black text-2xl tracking-tighter uppercase">UNIFLOW AI PRO</span>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">© 2024 UniFlow Ecosystem • Todos los sistemas nominales.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-12 rounded-[3rem] border-2 bg-white hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] hover:border-primary/20 transition-all group relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      <div className="p-6 rounded-[2rem] bg-muted/50 group-hover:bg-primary/10 transition-all inline-block mb-10 relative z-10 shadow-inner">
        {icon}
      </div>
      <h3 className="text-3xl font-headline font-black mb-5 uppercase tracking-tight relative z-10">{title}</h3>
      <p className="text-muted-foreground text-lg leading-relaxed font-medium relative z-10">{description}</p>
    </div>
  )
}
