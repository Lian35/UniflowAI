
"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, addDoc, serverTimestamp, deleteDoc, doc, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Trash2, Search, BookOpen, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NotesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const notesQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "notes"), orderBy("updatedAt", "desc"))
  }, [user, db])

  const subjectsQuery = useMemoFirebase(() => {
    if (!user) return null
    return collection(db, "users", user.uid, "subjects")
  }, [user, db])

  const { data: notes, isLoading: notesLoading } = useCollection(notesQuery)
  const { data: subjects } = useCollection(subjectsQuery)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newNote, setNewNote] = useState({ 
    title: "", 
    content: "", 
    subjectId: "",
  })

  const handleAddNote = async () => {
    if (!user || !newNote.title || !newNote.content) {
      toast({ title: "Error", description: "El título y el contenido son obligatorios.", variant: "destructive" })
      return
    }

    try {
      await addDoc(collection(db, "users", user.uid, "notes"), {
        ...newNote,
        userId: user.uid,
        tags: [],
        isShared: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      setNewNote({ title: "", content: "", subjectId: "" })
      setIsAddOpen(false)
      toast({ title: "Nota guardada", description: "Tus apuntes se han almacenado correctamente." })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "notes", id))
      toast({ title: "Nota eliminada", description: "La nota ha sido borrada." })
    } catch (error) {
      console.error(error)
    }
  }

  const filteredNotes = notes?.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSubjectName = (id: string) => subjects?.find(s => s.id === id)?.name || "Sin Materia"

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">Mis Apuntes</h1>
          <p className="text-muted-foreground">Tu base de conocimientos organizada y accesible</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar notas..." 
              className="pl-10 w-full md:w-[250px]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 font-bold">
                <Plus className="h-4 w-4" />
                Nueva Nota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Apunte</DialogTitle>
                <DialogDescription>Registra tus ideas, conceptos o resúmenes de clase.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Título</Label>
                  <Input 
                    id="note-title" 
                    placeholder="Ej: Resumen de Termodinámica" 
                    value={newNote.title} 
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Materia Relacionada</Label>
                  <Select value={newNote.subjectId} onValueChange={(val) => setNewNote({ ...newNote, subjectId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia (opcional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Escribe aquí tus apuntes..." 
                    className="min-h-[200px]"
                    value={newNote.content} 
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddNote}>Guardar Nota</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {notesLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filteredNotes && filteredNotes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note: any) => (
            <Card key={note.id} className="group border-none shadow-md hover:shadow-xl transition-all flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-headline text-lg line-clamp-1">{note.title}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {getSubjectName(note.subjectId)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                  {note.content}
                </p>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t py-3 flex justify-between items-center">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Actualizado hoy
                </div>
                <Button variant="link" className="p-0 h-auto text-xs font-bold text-primary">Abrir Nota</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 opacity-50 bg-white dark:bg-card rounded-2xl border border-dashed">
          <FileText className="h-16 w-16" />
          <div>
            <p className="font-bold">Aún no tienes notas</p>
            <p className="text-sm">Empieza a digitalizar tus conocimientos.</p>
          </div>
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>Crear mi primera nota</Button>
        </div>
      )}
    </div>
  )
}
