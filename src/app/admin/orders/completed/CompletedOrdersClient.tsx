"use client"

import { useState, useMemo } from "react"
import { Package, Search, History, Filter, RefreshCcw, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { restoreCompletedOrder } from "@/app/actions/order-actions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CompletedOrdersClient({ orders, initialDays = 30 }: { orders: any[], initialDays?: number }) {
  const router = useRouter()
  const { toast } = useToast()

  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (o.batch?.category) {
        map.set(o.batch.category.id, o.batch.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      let matchCat = true;
      if (selectedCategory) {
        matchCat = o.batch?.category?.id === selectedCategory;
      }
      let matchQuery = true;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        matchQuery = 
          o.customerName?.toLowerCase().includes(q) ||
          o.customerPhone?.toLowerCase().includes(q) ||
          o.accountNumber?.toLowerCase().includes(q);
      }
      return matchCat && matchQuery;
    });
  }, [orders, selectedCategory, searchQuery]);

  async function handleRestoreOrder(orderId: string) {
    if (!window.confirm("Энэ захиалгыг буцааж идэвхтэй захиалгуудын жагсаалт руу шилжүүлэх үү?")) return;
    
    setRestoringId(orderId)
    const res = await restoreCompletedOrder(orderId)
    setRestoringId(null)

    if (res.success) {
      toast({
        title: "Амжилттай",
        description: "Захиалгыг амжилттай сэргээлээ."
      })
      router.refresh()
    } else {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: res.error || "Сэргээхэд алдаа гарлаа"
      })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto mt-4">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <History className="w-5 h-5 text-green-600" />
            Дууссан захиалгын түүх
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-36">
              <History className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select 
                value={initialDays} 
                onChange={(e) => {
                  router.push(`/admin/orders/completed?days=${e.target.value}`)
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                <option value="7">Сүүлийн 7 хоног</option>
                <option value="30">Сүүлийн 1 сар</option>
                <option value="90">Сүүлийн 3 сар</option>
                <option value="0">Бүх хугацаа</option>
              </select>
            </div>
            <div className="relative flex-1 md:w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Нэр, утас, данс..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              >
                <option value="">Бүх ангилал</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-medium px-3 py-1 whitespace-nowrap hidden lg:inline-flex">
              Нийт {filteredOrders.length} олдлоо
            </Badge>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 py-4 px-4 w-[100px]">#</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-4">Хэрэглэгч</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-4">Эх үүсвэр (Бараа)</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-4">Тоо / Үнэ</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-4">Төлөв</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-4">Огноо</TableHead>
                <TableHead className="font-semibold text-slate-700 py-4 px-4 text-center">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                      <Package className="w-10 h-10 text-slate-300" />
                      <p>Илэрц олдсонгүй.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const totalCalculatedCargo = Number(order.cargoFee || 0) > 0 
                    ? Number(order.cargoFee) * order.quantity 
                    : (Number(order.batch?.cargoFeeStatus || 0) * Number(order.batch?.product?.weight || 0) * order.quantity);

                  return (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-4 font-bold text-slate-900 border-r border-slate-100">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="font-medium text-slate-900 mb-1">{order.customerName}</div>
                      <div className="text-sm text-slate-500">{order.customerPhone}</div>
                      {order.accountNumber && (
                        <div className="text-xs font-mono bg-slate-100 inline-block px-1 rounded text-slate-600 mt-1">
                          Данс: {order.accountNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 min-w-[250px]">
                      <div className="flex flex-col space-y-1">
                        {order.batch?.category && (
                          <Link href={`/admin/orders/category/${order.batch.category.id}`} className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                            {order.batch.category.name} <span className="text-[10px]">▶</span>
                          </Link>
                        )}
                        <Link href={`/admin/orders/batch/${order.batch?.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors inline-block break-words">
                          {order.batch?.product?.name}
                        </Link>
                        <div className="text-xs text-slate-500 font-medium">Багц #{order.batch?.batchNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="space-y-1.5">
                        <Badge variant="outline" className="font-bold text-slate-700 border-slate-300">
                          {order.quantity} ш
                        </Badge>
                        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block whitespace-nowrap">
                          К: {totalCalculatedCargo.toLocaleString()} ₮
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                        <StatusBadge status={order.status?.name || "Дууссан"} color={order.status?.color} />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap border-l border-slate-100">
                      <div className="text-xs font-semibold text-slate-700 mb-1">Дууссан:</div>
                      <div className="text-slate-900 font-medium">{new Date(order.updatedAt).toLocaleDateString("mn-MN")}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(order.updatedAt).toLocaleTimeString("mn-MN", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400">Үүссэн: {new Date(order.createdAt).toLocaleDateString("mn-MN")}</div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restoringId === order.id}
                        onClick={() => handleRestoreOrder(order.id)}
                        className="text-xs h-8 text-slate-600 hover:text-indigo-600 border-slate-200"
                      >
                        {restoringId === order.id ? (
                          <Loader2 className="w-4 h-4 mr-1.5 pt-0 animate-spin" />
                        ) : (
                          <RefreshCcw className="w-3 h-3 mr-1.5" />
                        )}
                        Сэргээх
                      </Button>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
