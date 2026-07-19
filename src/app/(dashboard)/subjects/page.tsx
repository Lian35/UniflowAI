
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase"
import { collection, doc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  GraduationCap, 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2, 
  UploadCloud, 
  FileText, 
  Search, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ArrowRightCircle,
  CalendarDays,
  Target,
  Edit2,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { parseAcademicFiles } from "@/ai/flows/academic-file-parser-flow"

type SubjectStatus = "Current" | "Passed" | "Failed" | "Pending" | "Future"

interface ScheduleBlock {
  day: string
  startTime: string
  endTime: string
  room?: string
}

interface Subject {
  id: string
  name: string
  code: string
  professor?: string
  semester: number
  credits: number
  status: SubjectStatus
  schedule?: ScheduleBlock[]
}

export default function SubjectsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const subjectsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(collection(db, "users", user.uid, "subjects"), orderBy("semester", "asc"))
  }, [user, db])

  const { data: subjects, isLoading } = useCollection<Subject>(subjectsQuery)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const scanInputRef = useRef<HTMLInputElement>(null)

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    semester: "1",
    credits: "4",
    status: "Pending" as SubjectStatus,
    schedule: [] as ScheduleBlock[]
  })

  // Estadísticas Estratégicas
  const stats = useMemo(() => {
    if (!subjects) return { total: 0, percent: 0, currentCredits: 0, approvedCredits: 0, load: 'light' as const, failedCount: 0 }
    
    const approved = subjects.filter(s => s.status === 'Passed')
    const current = subjects.filter(s => s.status === 'Current')
    const failed = subjects.filter(s => s.status === 'Failed')
    
    const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 0), 0)
    const approvedCredits = approved.reduce((acc, s) => acc + (s.credits || 0), 0)
    const currentCredits = current.reduce((acc, s) => acc + (s.credits || 0), 0)
    
    const percent = totalCredits > 0 ? Math.round((approvedCredits / totalCredits) * 100) : 0
    const load = currentCredits > 24 ? 'heavy' as const : currentCredits > 18 ? 'balanced' as const : 'light' as const

    return { 
      total: subjects.length, 
      percent, 
      currentCredits, 
      approvedCredits, 
      load, 
      failedCount: failed.length 
    }
  }, [subjects])

  const handleUpdateStatus = (subjectId: string, newStatus: SubjectStatus) => {
    if (!user) return
    if (user.isAnonymous) {
      toast({ title: "Modo Demo", description: "Regístrate para guardar cambios.", variant: "destructive" })
      return
    }
    updateDocumentNonBlocking(doc(db, "users", user.uid, "subjects", subjectId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    })
    toast({ 
      title: "Estado actualizado", 
      description: `La materia ahora está en estado: ${newStatus === 'Current' ? 'Matriculada' : newStatus === 'Passed' ? 'Aprobada' : newStatus}` 
    })
  }

  const handleOpenEdit = (subject: Subject) => {
    setCurrentId(subject.id)
    setFormData({
      name: subject.name,
      code: subject.code || "",
      semester: subject.semester.toString(),
      credits: subject.credits.toString(),
      status: subject.status,
      schedule: subject.schedule || []
    })
    setIsAddOpen(true)
  }

  const handleSaveSubject = () => {
    if (!user || !formData.name) {
      toast({ title: "Nombre requerido", variant: "destructive" })
      return
    }

    if (user.isAnonymous) {
      toast({ title: "Modo Demo", description: "Los cambios no se guardarán en el servidor.", variant: "destructive" })
      setIsAddOpen(false)
      resetForm()
      return
    }

    const payload = {
      ...formData,
      semester: parseInt(formData.semester),
      credits: parseInt(formData.credits),
      userId: user.uid,
      updatedAt: serverTimestamp()
    }

    if (currentId) {
      updateDocumentNonBlocking(doc(db, "users", user.uid, "subjects", currentId), payload)
      toast({ title: "Materia actualizada" })
    } else {
      addDocumentNonBlocking(collection(db, "users", user.uid, "subjects"), {
        ...payload,
        createdAt: serverTimestamp()
      })
      toast({ title: "Materia creada" })
    }

    setIsAddOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setCurrentId(null)
    setFormData({ name: "", code: "", semester: "1", credits: "4", status: "Pending", schedule: [] })
  }

  const addScheduleBlock = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { day: "Lunes", startTime: "08:00", endTime: "10:00", room: "" }]
    }))
  }

  const removeScheduleBlock = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }))
  }

  const updateScheduleBlock = (index: number, field: keyof ScheduleBlock, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((block, i) => i === index ? { ...block, [field]: value } : block)
    }))
  }

  const handleScanFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !user) return

    if (user.isAnonymous) {
      toast({ title: "Modo Demo", description: "El escaneo está disponible para observar, pero no guardará resultados.", variant: "destructive" })
      // Podríamos dejar que escanee para que vea cómo funciona, pero no guardar
    }

    setIsScanning(true)
    try {
      const fileData = await Promise.all(files.map(file => {
        return new Promise<{url: string, contentType: string}>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve({ url: reader.result as string, contentType: file.type })
          reader.readAsDataURL(file)
        })
      }))

      const result = await parseAcademicFiles({ files: fileData, type: 'both' })
      
      if (!user.isAnonymous) {
        for (const sub of result.subjects) {
          const existing = subjects?.find(s => s.name.toLowerCase() === sub.name.toLowerCase())
          if (existing) {
            updateDocumentNonBlocking(doc(db, "users", user.uid, "subjects", existing.id), {
              schedule: sub.schedule || existing.schedule,
              credits: sub.credits || existing.credits,
              updatedAt: serverTimestamp()
            })
          } else {
            addDocumentNonBlocking(collection(db, "users", user.uid, "subjects"), {
              ...sub,
              status: sub.schedule && sub.schedule.length > 0 ? 'Current' : 'Pending',
              userId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          }
        }
        toast({ title: "Importación completa", description: "Tu malla ha sido actualizada con éxito." })
      } else {
        toast({ title: "Escaneo Finalizado", description: "En una cuenta Pro, esto actualizaría tu malla automáticamente." })
      }
      setIsScanOpen(false)
    } catch (error) {
      toast({ title: "Error en escaneo", variant: "destructive" })
    } finally {
      setIsScanning(false)
    }
  }

  const SubjectCard = ({ subject }: { subject: Subject }) => (
    <Card className="group relative rounded-[2rem] overflow-hidden border-none shadow-xl bg-white dark:bg-card hover:translate-y-[-4px] transition-all">
      <div className={cn(
        "absolute top-0 left-0 w-2 h-full",
        subject.status === 'Current' ? 'bg-primary' : 
        subject.status === 'Passed' ? 'bg-green-500' : 
        subject.status === 'Failed' ? 'bg-destructive' : 'bg-muted'
      )} />
      <CardContent className="p-6 pl-10">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-headline font-black tracking-tight">{subject.name}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{subject.credits} Créditos • Semestre {subject.semester}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={() => handleOpenEdit(subject)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Select 
              value={subject.status} 
              onValueChange={(val: SubjectStatus) => handleUpdateStatus(subject.id, val)}
            >
              <SelectTrigger className="w-[140px] h-8 text-[10px] font-black uppercase rounded-full border-none bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Current">Matriculada</SelectItem>
                <SelectItem value="Passed">Aprobada</SelectItem>
                <SelectItem value="Failed">Reprobada</SelectItem>
                <SelectItem value="Pending">No Matriculada</SelectItem>
                <SelectItem value="Future">Futura</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {subject.status === 'Current' && (
              <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-3">
                <Clock className="h-3 w-3 mr-1" /> {subject.schedule?.length || 0} Bloques
              </Badge>
            )}
            {subject.status === 'Passed' && (
              <Badge className="bg-green-500/10 text-green-600 border-none text-[8px] font-black uppercase px-3">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Completada
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              if (user?.isAnonymous) {
                toast({ title: "Acceso denegado", description: "No puedes borrar datos en modo demo.", variant: "destructive" })
                return
              }
              if (confirm("¿Eliminar esta materia?")) {
                deleteDocumentNonBlocking(doc(db, "users", user!.uid, "subjects", subject.id))
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          {/* Header & Strategic Progress */}
          <Card className="border-none shadow-2xl bg-white dark:bg-card rounded-[3.5rem] overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-primary via-accent to-primary" />
            <CardContent className="p-10 md:p-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-5">
                    <div className="p-5 bg-primary/10 rounded-[2rem] text-primary shadow-inner">
                      <GraduationCap className="h-10 w-10" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-headline font-black tracking-tight uppercase leading-none">Malla Curricular</h1>
                      <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Control Maestro de Carrera</p>
                    </div>
                  </div>
                  <div className="space-y-4 max-w-lg">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Progreso de Grado ({stats.percent}%)</span>
                      <span className="text-primary">{stats.approvedCredits} de {subjects?.reduce((a,b)=>a+(b.credits||0),0) || 0} Créditos</span>
                    </div>
                    <Progress value={stats.percent} className="h-5 rounded-full bg-muted/30 shadow-inner" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="gap-3 font-black rounded-2xl h-16 px-8 border-2 border-dashed border-primary text-primary hover:bg-primary/5 transition-all shadow-xl shadow-primary/5" onClick={() => setIsScanOpen(true)}>
                    <UploadCloud className="h-6 w-6" /> 
                    Importar Malla/Horario
                  </Button>
                  <Button size="lg" className="gap-3 font-black shadow-2xl rounded-2xl h-16 px-10 bg-primary hover:bg-primary/90 transition-all" onClick={() => { resetForm(); setIsAddOpen(true); }}>
                    <Plus className="h-6 w-6" /> Añadir Materia
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Load Alert Bar */}
          <div className={cn(
            "p-8 rounded-[2.5rem] shadow-xl border-l-[12px] transition-all flex items-center justify-between bg-white dark:bg-card",
            stats.load === 'heavy' ? 'border-destructive' : stats.load === 'balanced' ? 'border-orange-500' : 'border-green-500'
          )}>
            <div className="flex items-center gap-6">
              <div className={cn(
                "p-4 rounded-2xl shadow-lg",
                stats.load === 'heavy' ? 'bg-destructive text-white' : 'bg-green-500/10 text-green-500'
              )}>
                {stats.load === 'heavy' ? <AlertTriangle className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-tighter leading-tight">Carga del Semestre: {stats.currentCredits} Créditos</p>
                <p className="text-xs font-bold text-muted-foreground uppercase mt-1">
                  {stats.load === 'heavy' ? 'Riesgo Crítico: Considera reducir carga para mantener el promedio.' : 'Estado Óptimo: Tienes espacio para proyectos extracurriculares.'}
                </p>
              </div>
            </div>
            <Badge className={cn(
              "font-black uppercase tracking-widest px-6 py-2 rounded-full text-[10px]",
              stats.load === 'heavy' ? 'bg-destructive' : stats.load === 'balanced' ? 'bg-orange-500' : 'bg-green-500'
            )}>
              {stats.load.toUpperCase()}
            </Badge>
          </div>

          {/* Subject Explorer Tabs */}
          <Tabs defaultValue="active" className="w-full space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <TabsList className="bg-muted/50 p-1.5 rounded-[2rem] h-16 w-full md:w-auto">
                <TabsTrigger value="active" className="rounded-full px-8 h-full font-black uppercase text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Activas</TabsTrigger>
                <TabsTrigger value="passed" className="rounded-full px-8 h-full font-black uppercase text-[10px] data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all">Aprobadas</TabsTrigger>
                <TabsTrigger value="failed" className="rounded-full px-8 h-full font-black uppercase text-[10px] data-[state=active]:bg-destructive data-[state=active]:text-white transition-all">Reprobadas</TabsTrigger>
                <TabsTrigger value="future" className="rounded-full px-8 h-full font-black uppercase text-[10px] data-[state=active]:bg-slate-700 data-[state=active]:text-white transition-all">Malla Total</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar asignatura..." 
                  className="pl-12 h-14 rounded-full border-none bg-white dark:bg-card shadow-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="active" className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2">
                {subjects?.filter(s => s.status === 'Current' && s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <SubjectCard key={s.id} subject={s} />)}
                {subjects?.filter(s => s.status === 'Current').length === 0 && (
                  <div className="md:col-span-2 py-20 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed opacity-40">
                    <CalendarDays className="h-16 w-16 mx-auto mb-4" />
                    <p className="font-headline font-black text-xl uppercase">No hay materias matriculadas hoy</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="passed" className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2">
                {subjects?.filter(s => s.status === 'Passed' && s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <SubjectCard key={s.id} subject={s} />)}
              </div>
            </TabsContent>

            <TabsContent value="failed" className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2">
                {subjects?.filter(s => s.status === 'Failed' && s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <SubjectCard key={s.id} subject={s} />)}
              </div>
            </TabsContent>

            <TabsContent value="future" className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 md:grid-cols-2">
                {subjects?.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => <SubjectCard key={s.id} subject={s} />)}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Intelligence */}
        <div className="w-full lg:w-80 space-y-8">
          <Card className="border-none shadow-2xl bg-black text-white rounded-[3rem] p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Target className="h-24 w-24" /></div>
            <div className="relative z-10 space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Diagnóstico AI</h3>
              <div className="space-y-6">
                {stats.failedCount > 0 && (
                  <div className="p-5 rounded-2xl bg-destructive/20 border border-destructive/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-[10px] font-black uppercase text-destructive">Alerta de Rezago</span>
                    </div>
                    <p className="text-xs font-bold leading-relaxed">
                      Detectamos {stats.failedCount} materias reprobadas. Recomendamos matricularlas primero el próximo semestre para evitar bloqueos en la malla.
                    </p>
                  </div>
                )}
                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase text-primary">Próximo Hito</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    Te faltan {(subjects?.reduce((a,b)=>a+(b.credits||0),0) || 0) - stats.approvedCredits} créditos para completar tu formación.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="p-8 rounded-[3rem] bg-white dark:bg-card shadow-xl border border-dashed text-center space-y-4">
            <ArrowRightCircle className="h-10 w-10 mx-auto text-primary opacity-30" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tip: Solo las materias "Matriculadas" aparecen en tu horario semanal.</p>
          </div>
        </div>
      </div>

      {/* Entry/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(val) => { if(!val) resetForm(); setIsAddOpen(val); }}>
        <DialogContent className="rounded-[3rem] border-none shadow-2xl sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-headline font-black">{currentId ? 'Editar Materia' : 'Añadir Materia'}</DialogTitle>
            <DialogDescription>Gestiona los detalles y horarios de tu asignatura.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Nombre de la Asignatura</Label>
              <Input className="h-14 rounded-2xl bg-muted/30 border-none" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Créditos ACD/16</Label>
                <Input type="number" className="h-14 rounded-2xl bg-muted/30 border-none" value={formData.credits} onChange={e=>setFormData({...formData, credits: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Semestre</Label>
                <Select value={formData.semester} onValueChange={v=>setFormData({...formData, semester: v})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[1,2,3,4,5,6,7,8,9,10].map(n=><SelectItem key={n} value={n.toString()}>Semestre {n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Horarios Section */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1">Horarios de Clase</Label>
                <Button variant="outline" size="sm" onClick={addScheduleBlock} className="h-8 rounded-xl font-bold text-[10px] border-2">
                  + Añadir Bloque
                </Button>
              </div>
              
              {formData.schedule.length === 0 ? (
                <p className="text-[10px] text-center text-muted-foreground italic py-4 bg-muted/10 rounded-2xl border border-dashed">
                  No hay horarios definidos para esta materia.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.schedule.map((block, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end bg-muted/20 p-4 rounded-2xl border border-border/50">
                      <div className="col-span-4 space-y-1">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Día</Label>
                        <Select value={block.day} onValueChange={v => updateScheduleBlock(index, 'day', v)}>
                          <SelectTrigger className="h-10 text-[10px] rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Inicio</Label>
                        <Input type="time" className="h-10 text-[10px] rounded-xl" value={block.startTime} onChange={e => updateScheduleBlock(index, 'startTime', e.target.value)} />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground">Fin</Label>
                        <Input type="time" className="h-10 text-[10px] rounded-xl" value={block.endTime} onChange={e => updateScheduleBlock(index, 'endTime', e.target.value)} />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10" onClick={() => removeScheduleBlock(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
            <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20" onClick={handleSaveSubject}>
              {currentId ? 'Actualizar Materia' : 'Guardar en Malla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Dialog */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="rounded-[3.5rem] border-none shadow-2xl sm:max-w-[550px] p-10">
          <DialogHeader className="text-center space-y-4 mb-6">
            <div className="inline-flex p-4 bg-primary/10 rounded-[2rem] text-primary mx-auto">
              <Sparkles className="h-10 w-10" />
            </div>
            <DialogTitle className="text-3xl font-headline font-black">Intérprete Chronos</DialogTitle>
            <DialogDescription>Sube tu horario o malla curricular. La IA extraerá los créditos y horarios automáticamente.</DialogDescription>
          </DialogHeader>
          <div 
            className={cn(
              "border-4 border-dashed rounded-[3rem] p-20 text-center transition-all cursor-pointer relative overflow-hidden group",
              isScanning ? "bg-primary/5 border-primary" : "bg-muted/20 border-muted hover:border-primary/40"
            )}
            onClick={() => !isScanning && scanInputRef.current?.click()}
          >
            {isScanning ? (
              <div className="space-y-6">
                <Loader2 className="h-16 w-16 mx-auto animate-spin text-primary" />
                <p className="font-black text-sm uppercase tracking-widest text-primary animate-pulse">Analizando Estructura...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <UploadCloud className="h-16 w-16 mx-auto text-muted-foreground opacity-50 group-hover:scale-110 transition-transform" />
                <p className="font-black uppercase tracking-widest text-xs">Suelta PDF o Imagen aquí</p>
                <Badge variant="secondary" className="font-bold">PDF, JPG, PNG</Badge>
              </div>
            )}
            <input type="file" ref={scanInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleScanFiles} disabled={isScanning} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
