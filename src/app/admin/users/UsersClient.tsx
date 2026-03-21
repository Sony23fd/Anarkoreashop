"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Shield, Truck } from "lucide-react"

interface User {
  id: string
  email: string | null
  name: string | null
  role: string
  createdAt: string
}

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("CARGO_ADMIN")

  function resetForm() {
    setEmail("")
    setPassword("")
    setName("")
    setRole("CARGO_ADMIN")
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || !role) return
    
    setIsSubmitting(true)
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Үүсгэхэд алдаа гарлаа")
      }
      
      toast({
        title: "Амжилттай!",
        description: "Шинэ хэрэглэгч нэмэгдлээ.",
      })
      
      setUsers(prev => [data.user, ...prev])
      setIsModalOpen(false)
      resetForm()
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 py-5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <CardTitle className="text-xl">Хэрэглэгчдийн жагсаалт</CardTitle>
          <CardDescription className="mt-1">
            Системд бүртгэлтэй ({users.length}) админ байна.
          </CardDescription>
        </div>
        
        <div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#4e3dc7] hover:bg-indigo-700 text-white shadow-sm font-medium">
            <Plus className="w-4 h-4 mr-2" /> Хэрэглэгч нэмэх
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Шинэ хэрэглэгч үүсгэх</DialogTitle>
              <DialogDescription>
                Карго админ эсвэл Үндсэн админ шинээр нэмэх.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Имэйл хаяг</label>
                <Input 
                  id="email" 
                  type="email" 
                  autoComplete="off"
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@anarshop.mn" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Нууц үг</label>
                <Input 
                  id="password" 
                  type="password" 
                  autoComplete="new-password"
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Нууц үг..." 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Хэрэглэгчийн нэр</label>
                <Input 
                  id="name" 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Оргил, Бат..." 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Эрхийн түвшин</label>
                <Select value={role} onValueChange={(val) => setRole(val as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Сонгох..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CARGO_ADMIN">Карго Админ</SelectItem>
                    <SelectItem value="ADMIN">Үндсэн Админ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                  <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !email || !password}
                  className="bg-[#4e3dc7] hover:bg-indigo-700 w-full font-medium"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Хадгалах
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700 h-11">Нэр</TableHead>
              <TableHead className="font-semibold text-slate-700 h-11">Имэйл</TableHead>
              <TableHead className="font-semibold text-slate-700 h-11 text-center">Эрх</TableHead>
              <TableHead className="font-semibold text-slate-700 h-11 text-right">Бүртгүүлсэн</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-800">{user.name || "Нэргүй"}</TableCell>
                  <TableCell className="text-slate-600 font-medium">{user.email}</TableCell>
                  <TableCell className="text-center">
                    {user.role === "ADMIN" ? (
                      <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none px-2.5 py-0.5">
                        <Shield className="w-3 h-3 mr-1" /> Бааз Админ
                      </Badge>
                    ) : (
                      <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200 border-none px-2.5 py-0.5">
                        <Truck className="w-3 h-3 mr-1" /> Карго Админ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-slate-500 text-sm">
                    {new Intl.DateTimeFormat('mn-MN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(user.createdAt))}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  Хэрэглэгч олдсонгүй
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
