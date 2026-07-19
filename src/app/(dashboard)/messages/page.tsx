
"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase"
import { collection, query, where, doc, addDoc, serverTimestamp, limit } from "firebase/firestore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Send, 
  MoreVertical, 
  Plus, 
  Users, 
  User, 
  Phone, 
  Video, 
  MessageCircle,
  MessagesSquare,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Smile,
  Info,
  Circle
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false)
  const [groupTitle, setGroupTitle] = useState("")
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [searchUser, setSearchUser] = useState("")
  
  // Estado de conexión real
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch Chats
  const chatsQuery = useMemoFirebase(() => {
    if (!user) return null
    return query(
      collection(db, "chats"), 
      where("participantIds", "array-contains", user.uid),
      limit(50)
    )
  }, [user, db])
  const { data: rawChats, isLoading: chatsLoading } = useCollection(chatsQuery)

  const chats = useMemo(() => {
    if (!rawChats) return []
    return [...rawChats].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
  }, [rawChats])

  // 2. Fetch Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!activeChatId) return null
    return query(collection(db, "chats", activeChatId, "messages"), limit(100))
  }, [activeChatId, db])
  const { data: rawMessages } = useCollection(messagesQuery)

  const messages = useMemo(() => {
    if (!rawMessages) return []
    return [...rawMessages].sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0))
  }, [rawMessages])

  // 3. Fetch all users for discovery
  const usersQuery = useMemoFirebase(() => collection(db, "users"), [db])
  const { data: allUsers } = useCollection(usersQuery)

  const activeChat = useMemo(() => chats?.find(c => c.id === activeChatId), [chats, activeChatId])
  
  const chatPartner = useMemo(() => {
    if (!activeChat || activeChat.type !== 'private') return null
    const partnerId = activeChat.participantIds.find((id: string) => id !== user?.uid)
    return allUsers?.find(u => u.id === partnerId)
  }, [activeChat, allUsers, user])

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
      }
    }
  }, [messages])

  const handleSendMessage = (type: "text" | "image" = "text", content?: string) => {
    const textToSend = content || newMessage
    if (!textToSend.trim() || !activeChatId || !user) return

    const messageData = {
      senderId: user.uid,
      senderName: user.displayName || "Usuario",
      text: textToSend,
      type: type,
      timestamp: serverTimestamp(),
      readBy: [user.uid],
      reactions: {}
    }

    addDocumentNonBlocking(collection(db, "chats", activeChatId, "messages"), messageData)
    
    updateDocumentNonBlocking(doc(db, "chats", activeChatId), {
      lastMessage: {
        text: type === 'image' ? '📷 Imagen' : textToSend,
        senderId: user.uid,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    })

    if (type === "text") setNewMessage("")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      handleSendMessage("image", reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const startPrivateChat = async (partnerId: string) => {
    if (!user) return
    const existing = chats?.find(c => 
      c.type === 'private' && 
      c.participantIds.includes(partnerId) && 
      c.participantIds.includes(user.uid)
    )

    if (existing) {
      setActiveChatId(existing.id)
      setIsNewChatOpen(false)
      return
    }

    try {
      const chatRef = await addDoc(collection(db, "chats"), {
        type: 'private',
        participantIds: [user.uid, partnerId],
        adminIds: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null
      })
      setActiveChatId(chatRef.id)
      setIsNewChatOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  const createGroup = async () => {
    if (!user || !groupTitle || selectedParticipants.length === 0) return
    
    try {
      const chatRef = await addDoc(collection(db, "chats"), {
        type: 'group',
        title: groupTitle,
        participantIds: [user.uid, ...selectedParticipants],
        adminIds: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: { text: "Grupo creado", senderId: user.uid, timestamp: serverTimestamp() }
      })
      setActiveChatId(chatRef.id)
      setIsNewGroupOpen(false)
      setGroupTitle("")
      setSelectedParticipants([])
      toast({ title: "Grupo creado", description: `Has creado el grupo ${groupTitle}` })
    } catch (e) {
      console.error(e)
    }
  }

  const isConnected = user && isOnline

  return (
    <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-card rounded-3xl overflow-hidden shadow-2xl border animate-in fade-in duration-700">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r bg-muted/10 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-white dark:bg-card border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-headline font-bold">Mensajes</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-muted-foreground")} />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {isConnected ? "Ecosistema Activo" : "Sin Conexión"}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsNewGroupOpen(true)} title="Nuevo Grupo">
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsNewChatOpen(true)} title="Nuevo Chat">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar chats..." className="pl-10 rounded-full bg-muted/30 border-none h-10" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {chatsLoading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : chats.length > 0 ? (
            <div className="divide-y divide-muted/10">
              {chats.map((chat: any) => {
                const isPrivate = chat.type === 'private'
                const partner = isPrivate ? allUsers?.find(u => u.id === chat.participantIds.find((id: string) => id !== user?.uid)) : null
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full p-4 flex items-center gap-4 transition-colors hover:bg-muted/50 ${activeChatId === chat.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white dark:border-card shadow-sm">
                        {isPrivate ? (
                          <>
                            <AvatarImage src={partner?.avatarUrl || `https://picsum.photos/seed/${partner?.id}/200/200`} />
                            <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback className="bg-primary text-white"><Users className="h-6 w-6" /></AvatarFallback>
                        )}
                      </Avatar>
                      {isConnected && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm truncate">
                          {isPrivate ? partner?.firstName || "Usuario" : chat.title || "Grupo de Estudio"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {chat.updatedAt?.seconds ? format(new Date(chat.updatedAt.seconds * 1000), "HH:mm", { locale: es }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate font-medium">
                        {chat.lastMessage?.text || "Inicia una conversación..."}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center opacity-40">
              <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              <p className="text-sm font-bold">Sin conversaciones aún</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-card ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-card">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveChatId(null)}><ArrowLeft className="h-5 w-5" /></Button>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chatPartner?.avatarUrl || `https://picsum.photos/seed/${activeChat?.id}/200/200`} />
                    <AvatarFallback>{activeChat?.type === 'group' ? <Users /> : <User />}</AvatarFallback>
                  </Avatar>
                  {isConnected && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-card rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none">
                    {activeChat?.type === 'group' ? activeChat.title : chatPartner?.firstName || "Cargando..."}
                  </h3>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-1",
                    isConnected ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {isConnected ? "En línea" : "Desconectado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages?.map((msg: any) => {
                  const isMe = msg.senderId === user?.uid
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-[1.5rem] px-4 py-3 text-sm shadow-sm relative group ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted text-foreground rounded-tl-none border'
                      }`}>
                        {!isMe && activeChat?.type === 'group' && (
                          <span className="text-[10px] font-bold block mb-1 text-primary">{msg.senderName}</span>
                        )}
                        {msg.type === 'image' ? (
                          <img src={msg.text} alt="Adjunto" className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-90" />
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}
                        <span className={`text-[9px] block text-right mt-1 opacity-60 ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                          {msg.timestamp?.seconds ? format(new Date(msg.timestamp.seconds * 1000), "HH:mm", { locale: es }) : ''}
                        </span>
                        
                        {isMe && (
                          <button 
                            onClick={() => deleteDocumentNonBlocking(doc(db, "chats", activeChatId, "messages", msg.id))}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Input Footer */}
            <div className="p-4 border-t bg-muted/10">
              <div className="max-w-4xl mx-auto flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
                <div className="flex-1 relative flex items-center bg-background rounded-full border px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
                  <Input 
                    placeholder="Escribe un mensaje..." 
                    className="border-none bg-transparent focus-visible:ring-0 shadow-none text-sm"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button variant="ghost" size="icon" className="rounded-full"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
                </div>
                <Button 
                  size="icon" 
                  className="rounded-full h-12 w-12 shrink-0 shadow-lg shadow-primary/20"
                  onClick={() => handleSendMessage()}
                  disabled={!newMessage.trim() || !isConnected}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              {!isConnected && (
                <p className="text-[9px] text-center text-destructive font-black uppercase mt-2 tracking-widest">
                  Función de envío deshabilitada: reconectando cuenta...
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
            <div className="p-6 bg-primary/10 rounded-full mb-6 relative">
              <div className={cn("absolute inset-0 rounded-full bg-primary/20 scale-125", isConnected && "animate-ping")} />
              <MessagesSquare className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-headline font-bold">Tus mensajes privados</h2>
            <p className="text-muted-foreground max-w-sm mt-2 font-medium">Envía mensajes cifrados a tus compañeros de clase o crea grupos de estudio temáticos.</p>
            <div className="flex gap-4 mt-8">
              <Button className="gap-2 font-bold" onClick={() => setIsNewChatOpen(true)}><Plus className="h-4 w-4" /> Nuevo Chat</Button>
              <Button variant="outline" className="gap-2 font-bold" onClick={() => setIsNewGroupOpen(true)}><Users className="h-4 w-4" /> Nuevo Grupo</Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md border-none shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold">Nuevo Mensaje</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsNewChatOpen(false)}><Plus className="h-5 w-5 rotate-45" /></Button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar estudiantes..." className="pl-10" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
              </div>
              <ScrollArea className="h-80">
                <div className="space-y-1">
                  {allUsers?.filter(u => u.id !== user?.uid && u.firstName?.toLowerCase().includes(searchUser.toLowerCase())).map((u: any) => (
                    <button key={u.id} onClick={() => startPrivateChat(u.id)} className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors text-left">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/200/200`} />
                          <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-white dark:border-card rounded-full", isConnected ? "bg-green-500" : "bg-muted-foreground")} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>
        </div>
      )}

      {/* New Group Dialog */}
      {isNewGroupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md border-none shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold">Crear Grupo de Estudio</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsNewGroupOpen(false)}><Plus className="h-5 w-5 rotate-45" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nombre del Grupo</Label>
                <Input placeholder="Ej: Equipo Cálculo III" value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Seleccionar Participantes</Label>
                <ScrollArea className="h-60 border rounded-xl p-2">
                  <div className="space-y-1">
                    {allUsers?.filter(u => u.id !== user?.uid).map((u: any) => (
                      <div key={u.id} className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded-lg">
                        <Checkbox 
                          id={`user-${u.id}`} 
                          checked={selectedParticipants.includes(u.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedParticipants([...selectedParticipants, u.id])
                            else setSelectedParticipants(selectedParticipants.filter(id => id !== u.id))
                          }}
                        />
                        <label htmlFor={`user-${u.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                          <Avatar className="h-8 w-8"><AvatarImage src={u.avatarUrl} /><AvatarFallback><User /></AvatarFallback></Avatar>
                          <span className="text-sm font-medium">{u.firstName} {u.lastName}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Button className="w-full font-bold h-12" onClick={createGroup} disabled={!groupTitle || selectedParticipants.length === 0}>
                Crear Grupo ({selectedParticipants.length + 1} miembros)
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
