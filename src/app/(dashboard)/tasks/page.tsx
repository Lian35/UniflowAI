
"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function TasksPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const tasksQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "tasks"), orderBy("dueDate", "asc"))
  }, [user, db])

  const subjectsQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "subjects")
  }, [user, db])

  const { data: tasks, isLoading: tasksLoading } = useCollection(tasksQuery)
  const { data: subjects } = useCollection(subjectsQuery)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newTask, setNewTask] = useState({ 
    title: "", 
    subjectId: "", 
    dueDate: "", 
    priority: "Medium",
    type: "Assignment"
  })

  const handleAddTask = () => {
    if (!user || !newTask.title || !newTask.subjectId || !newTask.dueDate) return

    if (user.isAnonymous) {
      toast({ title: "Modo Demo", description: "Crea tareas para probar, pero se borrarán al salir.", variant: "destructive" })
      setIsAddOpen(false)
      setNewTask({ title: "", subjectId: "", dueDate: "", priority: "Medium", type: "Assignment" })
      return
    }

    addDocumentNonBlocking(collection(db, "users", user.uid, "tasks"), {
      ...newTask,
      userId: user.uid,
      status: "Pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    setNewTask({ title: "", subjectId: "", dueDate: "", priority: "Medium", type: "Assignment" })
    setIsAddOpen(false)
    toast({ title: "Tarea en cola", description: "Se está sincronizando con tu agenda..." })
  }

  const toggleTaskStatus = (taskId: string, currentStatus: string, taskTitle: string) => {
    if (!user) return
    if (user.isAnonymous) {
      toast({ title: "Modo Demo", description: "Funcionalidad de guardado desactivada.", variant: "destructive" })
      return
    }
    const newStatus = currentStatus === "Completed" ? "Pending" : "Completed"
    
    updateDocumentNonBlocking(doc(db, "users", user.uid, "tasks", taskId), {
      status: newStatus,
      completionDate: newStatus === "Completed" ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    })

    if (newStatus === "Completed") {
      addDocumentNonBlocking(collection(db, "users", user.uid, "notifications"), {
        type: "LOGRO",
        message: `¡Tarea completada: ${taskTitle}! Has ganado +50 XP.`,
        isRead: false,
        createdAt: serverTimestamp()
      })
    }
  }

  const handleDeleteTask = (id: string) => {
    if (!user) return
    if (user.isAnonymous) {
      toast({ title: "Modo Demo", description: "No puedes eliminar datos permanentes.", variant: "destructive" })
      return
    }
    deleteDocumentNonBlocking(doc(db, "users", user.uid, "tasks", id))
    toast({ title: "Tarea eliminada", description: "Se ha removido de tu lista." })
  }

  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || "Materia desconocida"

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Tareas y Entregas</h1>
          <p className="text-muted-foreground">Gestiona tus compromisos académicos y prioridades</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 font-bold shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nueva Tarea</DialogTitle>
              <DialogDescription>Define los detalles de tu próximo compromiso académico.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Tarea</Label>
                <Input 
                  id="title" 
                  placeholder="Ej: Ensayo de Microeconomía" 
                  value={newTask.title} 
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Materia</Label>
                  <Select value={newTask.subjectId} onValueChange={(val) => setNewTask({ ...newTask, subjectId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha de Entrega</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={newTask.dueDate} 
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={newTask.priority} onValueChange={(val) => setNewTask({ ...newTask, priority: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Baja</SelectItem>
                      <SelectItem value="Medium">Media</SelectItem>
                      <SelectItem value="High">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newTask.type} onValueChange={(val) => setNewTask({ ...newTask, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assignment">Tarea</SelectItem>
                      <SelectItem value="Exam">Examen</SelectItem>
                      <SelectItem value="Project">Proyecto</SelectItem>
                      <SelectItem value="Reading">Lectura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddTask}>Crear Tarea</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {tasksLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {tasks.map((task: any) => (
                  <div 
                    key={task.id} 
                    className={`p-4 flex items-center gap-4 transition-colors hover:bg-muted/30 ${task.status === 'Completed' ? 'opacity-60' : ''}`}
                  >
                    <Checkbox 
                      checked={task.status === "Completed"} 
                      onCheckedChange={() => toggleTaskStatus(task.id, task.status, task.title)}
                      className="h-5 w-5 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold text-sm truncate ${task.status === 'Completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </h4>
                        <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'} className="text-[10px] h-4">
                          {task.priority === 'High' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getSubjectName(task.subjectId)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate ? format(new Date(task.dueDate), "PPP", { locale: es }) : 'Sin fecha'}
                        </span>
                        <Badge variant="outline" className="text-[9px] font-normal uppercase">{task.type}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 opacity-50 bg-white dark:bg-card rounded-2xl border border-dashed">
            <CheckCircle2 className="h-16 w-16" />
            <div>
              <p className="font-bold">No tienes tareas pendientes</p>
              <p className="text-sm">¡Buen trabajo! Disfruta de tu tiempo libre o planifica algo nuevo.</p>
            </div>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>Crear mi primera tarea</Button>
          </div>
        )}
      </div>
    </div>
  )
}
