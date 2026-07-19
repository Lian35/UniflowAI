
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { useAuth, useUser } from "@/firebase"
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  FileText,
  MessageSquare,
  Timer,
  LineChart,
  Settings,
  Sparkles,
  Zap,
  LogOut,
  Brain,
  TrendingUp,
  CalendarDays,
  Target,
  MessagesSquare,
  Calendar as CalendarIcon,
  ShieldAlert,
  Users as UsersIcon,
  HardDrive,
  Activity,
  User as UserIcon,
  Github,
  Rocket
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const navMain = [
  { title: "Resumen", url: "/dashboard", icon: LayoutDashboard },
  { title: "Malla & Materias", url: "/subjects", icon: BookOpen },
  { title: "Horario Semanal", url: "/calendar", icon: CalendarIcon },
  { title: "Tareas", url: "/tasks", icon: CheckSquare },
  { title: "Notas", url: "/notes", icon: FileText },
]

const navAI = [
  { title: "Ejercicios AI", url: "/ai-assistant", icon: MessageSquare },
  { title: "Planificador", url: "/study-planner", icon: Sparkles },
  { title: "Resumidor", url: "/summarizer", icon: Zap },
  { title: "Análisis AI", url: "/analysis-ai", icon: Brain },
  { title: "Predicción", url: "/prediction", icon: Target },
]

const navTools = [
  { title: "Mensajería", url: "/messages", icon: MessagesSquare },
  { title: "Enfoque", url: "/timer", icon: Timer },
  { title: "Progreso", url: "/analytics", icon: LineChart },
  { title: "Agenda Inteligente", url: "/smart-agenda", icon: CalendarDays },
]

const adminNav = [
  { title: "Control Center", url: "/admin", icon: ShieldAlert },
  { title: "Usuarios Master", url: "/admin/users", icon: UsersIcon },
  { title: "Despliegue Git", url: "/admin/deployment", icon: Github },
  { title: "Salud Sistema", url: "/admin/system", icon: HardDrive },
  { title: "Monitor IA", url: "/admin/ai", icon: Activity },
]

function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brand_grad_side" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="28" fill="url(#brand_grad_side)" />
      <path 
        d="M30 65 C30 65 45 45 55 55 C65 65 80 35 80 35" 
        stroke="white" 
        strokeWidth="12" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <circle cx="80" cy="35" r="6" fill="white" />
    </svg>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const auth = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const isSuperAdmin = user?.email === 'fg664714@gmail.com'

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar">
      <SidebarHeader className="flex items-center px-4 py-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 flex-shrink-0">
            <BrandLogo className="h-full w-full drop-shadow-xl" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-headline font-black text-xl tracking-tighter leading-none">UNIFLOW</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-muted-foreground font-black tracking-[0.2em] uppercase">Master Edition</span>
              {user?.isAnonymous && <Badge variant="outline" className="h-3 px-1 text-[7px] font-black uppercase text-amber-600 border-amber-600/30 bg-amber-600/5">Demo</Badge>}
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-headline uppercase text-[9px] tracking-[0.2em] text-destructive font-black mb-4 px-2 opacity-60">Admin Protocol</SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className={`h-10 rounded-xl px-3 transition-all duration-200 ${pathname === item.url ? 'bg-destructive/10 text-destructive font-black' : 'hover:bg-destructive/5 text-muted-foreground hover:text-destructive'}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup className={isSuperAdmin ? "mt-4" : ""}>
          <SidebarGroupLabel className="font-headline uppercase text-[9px] tracking-[0.2em] text-muted-foreground/60 mb-4 px-2">Ecosistema</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-10 rounded-xl px-3 transition-all duration-200 ${pathname === item.url ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'hover:bg-muted'}`}
                >
                  <Link href={item.url}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="font-headline uppercase text-[9px] tracking-[0.2em] text-muted-foreground/60 mb-4 px-2">Inteligencia Core</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {navAI.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-10 rounded-xl px-3 transition-all duration-200 ${pathname === item.url ? 'bg-accent/10 text-accent font-bold shadow-sm' : 'hover:bg-muted'}`}
                >
                  <Link href={item.url}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="font-headline uppercase text-[9px] tracking-[0.2em] text-muted-foreground/60 mb-4 px-2">Productividad</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {navTools.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-10 rounded-xl px-3 transition-all duration-200 ${pathname === item.url ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'hover:bg-muted'}`}
                >
                  <Link href={item.url}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-muted/20">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ajustes" className="h-10 rounded-xl px-3">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut}
              tooltip="Cerrar Sesión" 
              className="h-10 rounded-xl px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
