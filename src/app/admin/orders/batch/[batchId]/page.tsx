import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Plus, Package, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getBatchById } from "@/app/actions/batch-actions"
import { getOrderStatuses } from "@/app/actions/order-actions"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { ExportButton } from "./ExportButton"
import { ImportButton } from "./ImportButton"
import { BatchOrdersClient } from "./BatchOrdersClient"

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  
  const [{ batch, success }, { statuses }] = await Promise.all([
    getBatchById(batchId),
    getOrderStatuses()
  ])

  if (!success || !batch) {
    notFound()
  }

  const validOrders = batch.orders.filter((o: any) => o.paymentStatus === 'CONFIRMED' && o.status?.name !== 'Цуцлагдсан')
  const totalQuantity = validOrders.reduce((sum: number, o: any) => sum + o.quantity, 0)
  const totalOrders = validOrders.length
  
  const activeOrders = validOrders.filter((o: any) => !o.status?.isFinal)
  const activeQuantity = activeOrders.reduce((sum: number, o: any) => sum + o.quantity, 0)

  return (
    <div className="w-full bg-[#fafafa] min-h-screen p-4 md:p-8 space-y-6">
      {/* Header Card */}
      <div className="bg-white p-8 rounded-xl shadow-sm border space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{batch.product?.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600 mt-6">
          <div className="space-y-4">
            <div>
              <p className="text-slate-500 mb-1 font-medium">Захиалгын огноо</p>
              <p className="font-semibold text-slate-900">{new Date(batch.createdAt).toISOString().split('T')[0]}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1 font-medium">Тайлбар</p>
              <p className="font-semibold text-slate-900">{batch.description || "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-slate-500 mb-1 font-medium text-right md:text-left">Үүсгэсэн хэрэглэгч</p>
            {/* Can link to admin user if relations exist. Assuming generic admin for now */}
          </div>
        </div>
      </div>

      {/* Orders Section Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-lg font-bold">Захиалгын зүйлс</h2>
        <div className="flex space-x-2">
          <ExportButton batchId={batchId} />
          <ImportButton batchId={batchId} />
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-slate-100 hover:text-accent-foreground text-sm bg-white h-9 px-3 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Нэмэх
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Шинэ захиалга бүртгэх</SheetTitle>
              </SheetHeader>
              <form action={async (formData) => {
                "use server"
                const { addOrderToBatch } = await import("@/app/actions/order-actions")
                const res = await addOrderToBatch(batch.id, {
                  customerName: formData.get("customerName") as string,
                  customerPhone: formData.get("customerPhone") as string,
                  accountNumber: formData.get("accountNumber") as string,
                  quantity: Number(formData.get("quantity")) || 1,
                  arrivalDate: formData.get("arrivalDate") as string,
                  deliveryDate: formData.get("deliveryDate") as string,
                  deliveryAddress: formData.get("deliveryAddress") as string,
                  statusId: formData.get("statusId") as string,
                })
                
                if (!res.success) {
                  // We'll throw it to the closest error boundary or we can handle it via UI toast.
                  // For now, logging to server console so we can see the exact error.
                  console.error("ADD ORDER FAILED:", res.error)
                }
              }} className="space-y-4 mt-6 text-left">
                
                <div className="space-y-2">
                  <label htmlFor="customerName" className="text-sm font-medium block">Хэрэглэгчийн нэр</label>
                  <Input id="customerName" name="customerName" required placeholder="Нэр..." />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="customerPhone" className="text-sm font-medium block">Утасны дугаар</label>
                  <Input id="customerPhone" name="customerPhone" required placeholder="Утас..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="accountNumber" className="text-sm font-medium block">Дансны дугаар</label>
                    <Input id="accountNumber" name="accountNumber" placeholder="Данс..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="quantity" className="text-sm font-medium block">Тоо ширхэг</label>
                    <Input id="quantity" name="quantity" type="number" required defaultValue="1" min="1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="arrivalDate" className="text-sm font-medium block">Ирэх өдөр</label>
                    <Input id="arrivalDate" name="arrivalDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="deliveryDate" className="text-sm font-medium block">Хүргүүлэх өдөр</label>
                    <Input id="deliveryDate" name="deliveryDate" type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="deliveryAddress" className="text-sm font-medium block">Хаяг</label>
                  <Input id="deliveryAddress" name="deliveryAddress" placeholder="Хаяг..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block text-slate-500">Карго үнэ (₮)</label>
                    <Input type="text" value="Автоматаар бодогдоно" readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="statusId" className="text-sm font-medium block">Статус</label>
                    <select 
                      id="statusId" 
                      name="statusId" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Сонгох...</option>
                      {statuses?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-[#4F46E5] text-white hover:bg-[#4338ca] mt-4">Хадгалах</Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#eff6ff] rounded border-none p-6 flex justify-between items-center bg-gradient-to-r from-[#eef2fe] to-[#e0e7ff] h-28">
          <div>
            <p className="text-[#3b82f6] text-sm font-semibold mb-2">Идэвхтэй / Нийт ширхэг</p>
            <h3 className="text-3xl font-bold text-[#1e3a8a]">
              {activeQuantity} <span className="text-xl text-[#60a5fa] font-medium">/ {totalQuantity}</span>
            </h3>
          </div>
          <div className="w-14 h-14 bg-cover bg-center" style={{backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238b5cf6"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15 6.04 7.5 12 10.85l5.96-3.35L12 4.15M5 15.91l6 3.38v-6.71L5 9.19v6.72m14 0v-6.72l-6 3.39v6.71l6-3.38"/></svg>')`}}>
            {/* Decorative box icon like the screenshot */}
          </div>
        </div>
        
        <div className="bg-[#f0fdf4] rounded border-none p-6 flex justify-between items-center bg-gradient-to-r from-[#eefbf4] to-[#dcfce7] h-28">
          <div>
            <p className="text-[#22c55e] text-sm font-semibold mb-2">Идэвхтэй / Нийт захиалга</p>
            <h3 className="text-3xl font-bold text-[#14532d]">
              {activeOrders.length} <span className="text-xl text-[#86efac] font-medium">/ {totalOrders}</span>
            </h3>
          </div>
          <div className="w-14 h-14 bg-cover bg-center" style={{backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f59e0b"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1m2 14H7v-2h7v2m3-4H7v-2h10v2m0-4H7V7h10v2z"/></svg>')`}}>
            {/* Decorative clipboard icon like the screenshot */}
          </div>
        </div>
      </div>

      {/* Client Component with Checkboxes */}
      <BatchOrdersClient activeOrders={activeOrders} batch={batch} statuses={statuses || []} />
    </div>
  )
}
