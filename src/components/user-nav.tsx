
"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, User, CreditCard, Settings, LogOut, Check } from "lucide-react"
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { signOut } from "firebase/auth"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function UserNav() {
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(5)
    )
  }, [user, db])

  const { data: notifications } = useCollection(notificationsQuery)
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/")
  }

  const markAsRead = (notificationId: string) => {
    if (!user) return
    updateDocumentNonBlocking(doc(db, "users", user.uid, "notifications", notificationId), {
      isRead: true
    })
  }

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="font-headline font-bold">Notificaciones</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount} nuevas
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[350px] overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex flex-col p-4 border-b last:border-0 hover:bg-muted/30 transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex justify-between w-full mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{notification.type}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {notification.createdAt?.seconds 
                        ? format(new Date(notification.createdAt.seconds * 1000), "HH:mm", { locale: es }) 
                        : "Reciente"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-snug mb-2 font-medium">
                    {notification.message}
                  </p>
                  {!notification.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-[10px] text-primary font-bold ml-auto hover:bg-primary/10"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-3 w-3 mr-1" /> Marcar como leída
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-10 text-center space-y-2 opacity-50">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-xs font-medium">No tienes notificaciones por ahora.</p>
              </div>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer py-3 hover:text-primary">
            Ver todas las notificaciones
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary">
            <Avatar className="h-9 w-9">
              <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} alt="Avatar" />
              <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-headline font-bold leading-none">{user?.displayName || "Estudiante"}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/analytics")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Mi Rendimiento</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive cursor-pointer font-medium"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
