
"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useUser, useFirestore } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Send, 
  Sparkles, 
  User, 
  Zap, 
  Loader2, 
  Trash2, 
  ImageIcon,
  FileText,
  X,
  Plus,
  BrainCircuit,
  UploadCloud,
  Youtube,
  PlayCircle
} from "lucide-react"
import { interactiveAIAssistant } from "@/ai/flows/interactive-ai-assistant-flow"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Attachment = {
  url: string
  name: string
  type: string
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: Attachment[]
  videoSuggestions?: { title: string, query: string }[]
}

export default function AIAssistantPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "¡Hola! Soy **TutorIA Pro**. Estoy listo para resolver cualquier reto STEM y recomendarte los mejores recursos visuales para tu aprendizaje. \n\n¿Qué tema quieres dominar hoy?"
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' })
      }
    }
  }, [messages, isLoading])

  const processFile = useCallback((file: File) => {
    if (file.size > 1024 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "Límite 1GB.", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedFiles(prev => [...prev, { url: reader.result as string, name: file.name, type: file.type }])
    }
    reader.readAsDataURL(file)
  }, [toast])

  const handleSend = async (overrideInput?: string) => {
    const textToUse = overrideInput || input
    if ((!textToUse.trim() && selectedFiles.length === 0) || isLoading || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToUse,
      attachments: [...selectedFiles]
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setSelectedFiles([])
    setIsLoading(true)

    try {
      const response = await interactiveAIAssistant({ 
        question: textToUse || "Analiza los archivos adjuntos.",
        attachments: userMessage.attachments?.map(a => ({ url: a.url, contentType: a.type })),
        userLevel: 'intermediate'
      })
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        videoSuggestions: textToUse.toLowerCase().includes('calculo') || textToUse.toLowerCase().includes('integral') ? [
          { title: "Dominando Integrales", query: "integrales por partes explicacion paso a paso" },
          { title: "Conceptos Base", query: "teorema fundamental del calculo intuitivo" }
        ] : undefined
      }
      
      setMessages(prev => [...prev, assistantMessage])

      // Registro para el usuario
      addDocumentNonBlocking(collection(db, "users", user.uid, "aiInteractions"), {
        userId: user.uid,
        question: userMessage.content,
        answer: assistantMessage.content,
        timestamp: serverTimestamp(),
        type: 'tutoria_pro'
      })

      // Registro Global para el Admin
      addDocumentNonBlocking(collection(db, "system_ai_interactions"), {
        userId: user.uid,
        userName: user.displayName,
        question: userMessage.content,
        answer: assistantMessage.content,
        timestamp: serverTimestamp(),
        type: 'tutoria_pro'
      })

      // Log de sistema
      addDocumentNonBlocking(collection(db, "system_logs"), {
        type: 'info',
        message: `Interacción IA procesada para usuario ${user.uid.substring(0, 5)}`,
        timestamp: serverTimestamp()
      })

    } catch (error) {
      toast({ title: "Error de IA", description: "No se pudo procesar la solicitud.", variant: "destructive" })
      
      // Log de error para el Admin
      addDocumentNonBlocking(collection(db, "system_logs"), {
        type: 'error',
        message: `Fallo en TutorIA Pro: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: serverTimestamp()
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="flex flex-col h-[calc(100vh-12rem)] space-y-4 animate-in fade-in duration-1000 max-w-5xl mx-auto relative"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(processFile); }}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-md border-4 border-dashed border-primary rounded-[3rem] flex flex-col items-center justify-center animate-in zoom-in">
          <UploadCloud className="h-20 w-20 text-primary animate-bounce" />
          <p className="text-2xl font-headline font-bold text-primary mt-4">Suelta tus ejercicios</p>
        </div>
      )}

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl text-white">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold">TutorIA Académica</h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Sistema Multimodal + Video Recomendado</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMessages([messages[0]])} className="rounded-full text-muted-foreground h-10">
          <Trash2 className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Reiniciar Sesión</span>
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden border-none shadow-2xl bg-white dark:bg-card/50 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem]">
        <CardContent className="p-0 flex flex-col h-full">
          <ScrollArea className="flex-1 px-4 md:px-8 pt-8" ref={scrollAreaRef}>
            <div className="space-y-10 pb-10">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className={`h-10 w-10 shrink-0 shadow-lg ${message.role === "user" ? "bg-accent" : "bg-primary"}`}>
                    <AvatarFallback className="text-white font-bold">{message.role === "user" ? <User /> : <Zap />}</AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-3 ${message.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                    <div className={cn("rounded-[2rem] px-6 py-5 shadow-xl transition-all", message.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted/30 text-foreground rounded-tl-none border")}>
                      <div className="whitespace-pre-wrap text-sm md:text-base prose dark:prose-invert max-w-none">{message.content}</div>
                    </div>
                    
                    {message.videoSuggestions && (
                      <div className="grid gap-3 w-full animate-in slide-in-from-left-4">
                        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest px-2">
                          <Youtube className="h-4 w-4" /> Recursos de Video Recomendados:
                        </div>
                        {message.videoSuggestions.map((vid, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl group hover:bg-red-500/10 transition-colors cursor-pointer" onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(vid.query)}`, '_blank')}>
                            <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg shadow-red-500/20">
                              <PlayCircle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold leading-tight">{vid.title}</p>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Click para ver en YouTube</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-6 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"><Zap className="h-5 w-5 text-primary opacity-50" /></div>
                  <div className="bg-muted/20 border rounded-[2rem] rounded-tl-none px-8 py-6 flex items-center gap-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs font-black tracking-widest text-muted-foreground uppercase">TutorIA Razonando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 md:p-8 border-t">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="relative flex items-center bg-background rounded-full border px-4 py-2 shadow-2xl">
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" onClick={() => fileInputRef.current?.click()}>
                  <Plus className="h-6 w-6" />
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => Array.from(e.target.files || []).forEach(processFile)} />
                <Input placeholder="Escribe tu duda académica..." className="border-none focus-visible:ring-0 shadow-none bg-transparent h-12 text-lg" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                <Button size="icon" className="rounded-full h-12 w-12 ml-2 bg-gradient-to-br from-primary to-accent" onClick={() => handleSend()} disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
