import { getProducts, createProduct } from "@/app/actions/product-actions"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { BatchSaleToggle } from "./BatchSaleToggle"
import { ImageUploader } from "@/components/admin/ImageUploader"
import { VideoUploader } from "@/components/admin/VideoUploader"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const { products, success } = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Бараанууд</h1>
          <p className="text-sm text-slate-500 mt-1">Монголд бэлэн байгаа барааг нүүр хуудсанд гаргах</p>
        </div>
        
        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338ca]">
            <Plus className="w-4 h-4 mr-2" />
            Бараа нэмэх
          </SheetTrigger>
          <SheetContent className="overflow-y-auto w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Шинэ бараа нэмэх</SheetTitle>
              <SheetDescription>Дэлгүүрт худалдаалах шинэ барааны мэдээллийг оруулна уу.</SheetDescription>
            </SheetHeader>
            <form action={async (formData) => {
              "use server"
              await createProduct({
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                targetQuantity: Number(formData.get("targetQuantity") || 0),
                remainingQuantity: Number(formData.get("remainingQuantity") || 0),
                price: Number(formData.get("price") || 0),
                weight: Number(formData.get("weight") || 0),
                sourceLink: formData.get("sourceLink") as string,
              })
            }} className="space-y-4 mt-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Барааны нэр</label>
                <Input id="name" name="name" required placeholder="Нэр..." />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Тайлбар</label>
                <Textarea id="description" name="description" placeholder="Барааны дэлгэрэнгүй..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">Үнэ (₮)</label>
                  <Input id="price" name="price" type="number" required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="weight" className="text-sm font-medium">Жин (кг)</label>
                  <Input id="weight" name="weight" type="number" step="0.01" placeholder="0.0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="targetQuantity" className="text-sm font-medium">Зорилтот тоо</label>
                  <Input id="targetQuantity" name="targetQuantity" type="number" required placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="remainingQuantity" className="text-sm font-medium">Үлдэгдэл</label>
                  <Input id="remainingQuantity" name="remainingQuantity" type="number" required placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="sourceLink" className="text-sm font-medium">Эх сурвалжийн холбоос</label>
                <Input id="sourceLink" name="sourceLink" type="url" placeholder="https://..." />
              </div>
              <Button type="submit" className="w-full bg-[#4F46E5] mt-4">Хадгалах</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm w-full border">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
          <span className="text-indigo-600 text-sm font-medium">📦 Монголд бэлэн бараа</span>
          <span className="text-slate-500 text-xs">— "Зарна" гэж тохируулсан бараа нүүр хуудасны "Бэлэн бүтээгдэхүүн" хэсэгт харагдана.</span>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-3">Бараа №</th>
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3">Зорилтот тоо</th>
                <th className="px-4 py-3">Үлдэгдэл</th>
                <th className="px-4 py-3">Үнэ</th>
                <th className="px-4 py-3">Жин</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Зураг</th>
                <th className="px-4 py-3 text-right">Нүүрт гарах / Хүргэлтийн үнэ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {success && products && products.length > 0 ? (
                products.map((batch: any) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium">#{batch.batchNumber}</td>
                    <td className="px-4 py-4 font-medium text-slate-900 max-w-[200px] truncate">{batch.product?.name}</td>
                    <td className="px-4 py-4 text-slate-700 font-semibold">{batch.targetQuantity}</td>
                    <td className="px-4 py-4">
                      {(() => {
                        const ordered = (batch.orders || [])
                          .filter((o: any) => o.paymentStatus !== 'REJECTED' && o.status?.name !== 'Цуцлагдсан')
                          .reduce((s: number, o: any) => s + o.quantity, 0)
                        const remaining = batch.targetQuantity - ordered
                        return (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {remaining} / {batch.targetQuantity}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-4 text-slate-600">₮{Number(batch.price || batch.product?.price || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-600">{Number(batch.product?.weight || 0)} кг</td>
                    <td className="px-4 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-medium">
                        {batch.status === 'OPEN' ? 'Нээлттэй' : 
                         batch.status === 'CLOSED' ? 'Хаагдсан' : 
                         batch.status === 'SHIPPED' ? 'Илгээгдсэн' : 'Ирсэн'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <ImageUploader
                          productId={batch.product?.id}
                          currentImageUrl={batch.product?.imageUrl}
                          batchName={batch.product?.name ?? ""}
                        />
                        <VideoUploader
                          productId={batch.product?.id}
                          currentVideoUrl={batch.product?.videoUrl}
                          batchName={batch.product?.name ?? ""}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <BatchSaleToggle
                        batchId={batch.id}
                        initialEnabled={batch.isAvailableForSale ?? false}
                        initialFee={Number(batch.deliveryFee || 0)}
                        dynamicRemainingQty={batch.targetQuantity - (batch.orders || [])
                          .filter((o: any) => o.paymentStatus !== 'REJECTED' && o.status?.name !== 'Цуцлагдсан')
                          .reduce((s: number, o: any) => s + o.quantity, 0)}
                        targetQty={batch.targetQuantity}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Одоогоор бараа бүртгэгдээгүй байна
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
