
"use client"

import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, query, orderBy, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  MoreVertical, 
  ShieldAlert, 
  Ban, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  Clock,
  User as UserIcon,
  ShieldCheck,
  History,
  Activity
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  // Guardia de Seguridad
  useEffect(() => {
    if (user && user.email !== 'fg664714@gmail.com') {
      router.push("/dashboard")
    }
  }, [user, router])

  const usersQuery = useMemoFirebase(() => query(collection(db, "users"), orderBy("createdAt", "desc")), [db])
  const { data: users, isLoading } = useCollection(usersQuery)

  const filteredUsers = users?.filter(u => 
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAction = (userId: string, action: string) => {
    if (!user) return
    const userRef = doc(db, "users", userId)

    switch(action) {
      case 'verify':
        updateDocumentNonBlocking(userRef, { verified: true, updatedAt: serverTimestamp() })
        toast({ title: "Usuario verificado", description: "Identidad confirmada manualmente." })
        break
      case 'suspend':
        updateDocumentNonBlocking(userRef, { accountStatus: 'suspended', updatedAt: serverTimestamp() })
        toast({ title: "Cuenta suspendida", description: "El acceso ha sido restringido." })
        break
      case 'activate':
        updateDocumentNonBlocking(userRef, { accountStatus: 'active', updatedAt: serverTimestamp() })
        toast({ title: "Cuenta activada", description: "Acceso restaurado." })
        break
      case 'delete':
        if(confirm("¿Estás seguro de eliminar este usuario? Esta acción es irreversible.")) {
          deleteDocumentNonBlocking(userRef)
          toast({ title: "Usuario eliminado", variant: "destructive" })
        }
        break
    }
  }

  if (!user || user.email !== 'fg664714@gmail.com') return null

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-700 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-headline font-black uppercase tracking-tight">Gestión de Estudiantes</h1>
          <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mt-1">Control total sobre la base de usuarios</p>
        </div>
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre o email..." 
            className="h-12 pl-12 rounded-2xl bg-white dark:bg-card border-none shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-3xl animate-pulse" />)
        ) : filteredUsers && filteredUsers.length > 0 ? (
          filteredUsers.map((u: any) => (
            <Card key={u.id} className="border-none shadow-xl bg-white dark:bg-card rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-16 w-16 border-4 border-muted shrink-0">
                  <AvatarImage src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/200/200`} />
                  <AvatarFallback className="text-xl font-bold bg-primary text-white">{u.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h3 className="text-xl font-headline font-black">{u.firstName} {u.lastName}</h3>
                    {u.role === 'super_admin' && <Badge className="bg-destructive font-black uppercase tracking-widest text-[8px]">Super Admin</Badge>}
                    <Badge variant={u.verified ? "default" : "secondary"} className="rounded-full text-[9px] font-black uppercase">
                      {u.verified ? "Verificado" : "No Verificado"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {u.email}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Registro: {u.createdAt?.seconds ? format(new Date(u.createdAt.seconds * 1000), "PPP", { locale: es }) : 'Desconocido'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden lg:flex flex-col items-end gap-1 px-6 border-r">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Status</p>
                    <p className={`text-xs font-bold uppercase ${u.accountStatus === 'active' ? 'text-green-500' : 'text-destructive'}`}>
                      {u.accountStatus || 'active'}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-muted"><MoreVertical className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                      <DropdownMenuLabel className="font-headline font-black text-xs uppercase tracking-widest px-3 py-2">Acciones Maestro</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {!u.verified && (
                        <DropdownMenuItem className="rounded-xl font-bold cursor-pointer text-primary" onClick={() => handleAction(u.id, 'verify')}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> Verificar Manualmente
                        </DropdownMenuItem>
                      )}
                      {u.accountStatus === 'suspended' ? (
                        <DropdownMenuItem className="rounded-xl font-bold cursor-pointer text-green-500" onClick={() => handleAction(u.id, 'activate')}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivar Cuenta
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="rounded-xl font-bold cursor-pointer text-orange-500" onClick={() => handleAction(u.id, 'suspend')}>
                          <Ban className="mr-2 h-4 w-4" /> Suspender Acceso
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="rounded-xl font-bold cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleAction(u.id, 'delete')}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Usuario
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-headline font-black opacity-40 uppercase">No se encontraron estudiantes</p>
          </div>
        )}
      </div>
    </div>
  )
}
