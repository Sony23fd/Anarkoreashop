"use client"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchOrders, updateOrderStatus } from "@/app/actions/order-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

import { StatusBadge } from "@/components/admin/StatusBadge"

export default function SearchClient({ statuses }: { statuses: any[] }) {
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [confirmChange, setConfirmChange] = useState<{orderId: string, newStatusId: string, oldStatusId: string | null} | null>(null)
  const { toast } = useToast()

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    
    setLoading(true)
    const result = await searchOrders(query)
    setLoading(false)
    setHasSearched(true)
    
    if (result.success && result.orders) {
      setOrders(result.orders)
    } else {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: "Жагсаалт унших үед алдаа гарлаа",
      })
    }
  }

  async function executeStatusChange() {
    if (!confirmChange) return;
    const { orderId, newStatusId } = confirmChange;
    const prevOrders = [...orders]
    
    // Optimistic UI
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, statusId: newStatusId, status: statuses.find(s => s.id === newStatusId) } : o
    ))
    setConfirmChange(null)

    const result = await updateOrderStatus(orderId, newStatusId)
    
    if (result.success) {
      toast({
        title: "Амжилттай",
        description: "Захиалгын төлөв өөрчлөгдлөө.",
      })
    } else {
      setOrders(prevOrders)
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: "Захиалгын төлөв өөрчлөх боломжгүй байна.",
      })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      {!!confirmChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmChange(null)} />
          <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 border animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Төлөв өөрчлөхийг баталгаажуулах</h3>
            <p className="text-sm text-slate-500 mb-6">
              Та энэхүү захиалгын төлөвийг <strong className="text-slate-700">{confirmChange ? statuses.find(s => s.id === confirmChange.newStatusId)?.name : ''}</strong> болгон өөрчлөхдөө итгэлтэй байна уу?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmChange(null)}>Буцах</Button>
              <Button onClick={executeStatusChange} className="bg-[#4e3dc7] hover:bg-[#4338ca] text-white">Тийм, өөрчлөх</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
          <Search className="w-4 h-4" /> Хайх
        </label>
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-50 border-transparent focus-visible:ring-1 text-lg py-6" 
            placeholder="Дансны дугаар, утасны дугаар эсвэл нэрээр хайх..." 
          />
          <Button type="submit" disabled={loading} className="bg-[#4F46E5] hover:bg-[#4338ca] text-white px-8 h-auto font-medium">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Хайх
          </Button>
        </form>
      </div>

      {!hasSearched ? null : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border shadow-sm border-dashed flex flex-col items-center justify-center text-center space-y-3 min-h-[400px]">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-medium text-slate-700">Илэрц олдсонгүй</h3>
          <p className="text-muted-foreground">Таны хайлтад тохирох захиалга олдсонгүй.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 py-4 px-4 w-[100px]">#</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 px-4">Хэрэглэгч</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 px-4">Бараа</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 px-4">Тоо</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 px-4">Төлөв</TableHead>
                  <TableHead className="font-semibold text-slate-700 py-4 px-4">Огноо</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-4 font-bold text-slate-900 border-r border-slate-100">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="font-medium text-slate-900 mb-1">{order.customerName}</div>
                      <div className="text-sm text-slate-500">{order.customerPhone}</div>
                      {order.accountNumber && (
                        <div className="text-xs font-mono bg-slate-100 inline-block px-1 rounded text-slate-600 mt-1">
                          {order.accountNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="font-medium text-slate-900">{order.batch?.product?.name}</div>
                      <div className="text-sm text-slate-500">Багц #{order.batch?.batchNumber}</div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant="outline" className="font-semibold text-slate-700 border-slate-200">
                        {order.quantity} ш
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Select 
                        value={order.statusId ? String(order.statusId) : undefined} 
                        onValueChange={(val) => {
                          if (val !== order.statusId) {
                            setConfirmChange({
                              orderId: order.id,
                              newStatusId: val,
                              oldStatusId: order.statusId || null
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                          <SelectValue placeholder="Төлөв сонгох">
                            {order.statusId ? (
                              <StatusBadge status={statuses.find(s => s.id === order.statusId)?.name || ""} color={statuses.find(s => s.id === order.statusId)?.color} />
                            ) : "Сонгох..."}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              <StatusBadge status={s.name} color={s.color} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap border-l border-slate-100">
                      {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                      <div className="text-xs opacity-70">
                        {new Date(order.createdAt).toLocaleTimeString("mn-MN", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
