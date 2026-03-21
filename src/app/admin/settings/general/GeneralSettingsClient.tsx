"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Upload, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"

interface Props {
  initialSettings: Record<string, string>
}

export function GeneralSettingsClient({ initialSettings }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [logoUrl, setLogoUrl] = useState(initialSettings["site_logo"] || "")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/settings/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Унших үед алдаа гарлаа")

      setLogoUrl(data.url)
      toast({
        title: "Зураг хуулагдлаа",
        description: "Одоо 'Хадгалах' товчийг дарна уу.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: error.message,
      })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site_logo", value: logoUrl }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Хадгалахад алдаа гарлаа")

      toast({
        title: "Амжилттай",
        description: "Сайтын лого хадгалагдлаа",
      })
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: error.message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Сайтын Лого</CardTitle>
        <CardDescription>
          Сайтын зүүн дээд буланд байрлах үндсэн лого. (Хэмжээ нь 16:9 эсвэл 1:1 харьцаатай байвал тохиромжтой)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-32 h-32 shrink-0 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 relative overflow-hidden group">
            {logoUrl ? (
              <>
                <Image src={logoUrl} alt="Лого" fill className="object-contain p-2" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-white opacity-80" />
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs text-slate-500">Лого байхгүй</span>
              </div>
            )}
            
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">Шинэ лого оруулах</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Зурган дээр дарж шинэ зураг оруулна уу. Лого хуулагдсаны дараа Хадгалах товчийг дарж баталгаажуулна. PNG, JPG өргөтгэлтэй, дээд тал нь 5MB зураг оруулна уу.
            </p>
            {isUploading && (
              <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium mt-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Хуулж байна...
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t border-slate-100 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isUploading || isSaving || !logoUrl || logoUrl === initialSettings["site_logo"]}
          className="bg-[#4e3dc7] hover:bg-indigo-700 text-white shadow-sm font-medium px-6"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Хадгалах
        </Button>
      </CardFooter>
    </Card>
  )
}
