
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Zap, Copy, Download, Loader2, Sparkles, FileText, LayoutGrid, List } from "lucide-react"
import { generateStructuredSummary } from "@/ai/flows/structured-summary-generator"
import { useToast } from "@/hooks/use-toast"

export default function SummarizerPage() {
  const [text, setText] = useState("")
  const [format, setFormat] = useState<'summary' | 'outline' | 'conceptual_map'>('summary')
  const [detailLevel, setDetailLevel] = useState<'concise' | 'standard' | 'detailed'>('standard')
  const [result, setResult] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un texto para procesar.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const output = await generateStructuredSummary({
        text,
        format,
        detailLevel
      })
      setResult(output.structuredContent)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el resumen.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result)
    toast({
      title: "Copiado",
      description: "El contenido se ha copiado al portapapeles."
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Resumidor Inteligente</h1>
          <p className="text-muted-foreground">Transforma textos largos en material de estudio estructurado</p>
        </div>
        <div className="bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Powered by AI
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Texto de Origen</CardTitle>
            <CardDescription>Pega el contenido que deseas resumir o estructurar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Textarea
                placeholder="Pega aquí tus notas, capítulos de libros o apuntes..."
                className="min-h-[300px] resize-none focus-visible:ring-primary"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formato deseado</Label>
                <Select value={format} onValueChange={(val: any) => setFormat(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Resumen Ejecutivo</SelectItem>
                    <SelectItem value="outline">Esquema Jerárquico</SelectItem>
                    <SelectItem value="conceptual_map">Mapa de Conceptos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nivel de detalle</Label>
                <Select value={detailLevel} onValueChange={(val: any) => setDetailLevel(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Conciso</SelectItem>
                    <SelectItem value="standard">Estándar</SelectItem>
                    <SelectItem value="detailed">Detallado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-lg font-bold gap-2 shadow-lg shadow-primary/20" 
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Generar Material
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-muted/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-headline">Resultado</CardTitle>
              <CardDescription>Contenido estructurado listo para estudiar</CardDescription>
            </div>
            {result && (
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copiar">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Descargar PDF">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-sm leading-relaxed p-6 bg-white dark:bg-card rounded-xl border border-dashed border-primary/30 min-h-[400px]">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 opacity-40">
                <FileText className="h-16 w-16" />
                <p>Tu resumen aparecerá aquí una vez que lo generes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
