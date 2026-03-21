"use client"

import { useState } from "react"
import { Truck } from "lucide-react"
import { requestDelivery } from "@/app/actions/order-actions"

export default function DeliveryRequestButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!address.trim()) return
    setLoading(true)
    setError(null)
    const res = await requestDelivery(orderId, address)
    setLoading(false)
    if (res.success) {
      setDone(true)
      setOpen(false)
    } else {
      setError(res.error || "Алдаа гарлаа")
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
        <Truck className="w-4 h-4" />
        Хүргэлт амжилттай захиалагдлаа!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Truck className="w-4 h-4" />
          Хүргэлт захиалах
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 bg-indigo-50 rounded-xl border border-indigo-100 p-4">
          <label className="block text-sm font-semibold text-slate-800">
            🏠 Хүргүүлэх хаяг оруулна уу
          </label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            required
            placeholder="Дүүрэг, хороо, хаяг, утасны дугаар..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !address.trim()}
              className="flex-1 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Захиалж байна..." : "Батлах"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
            >
              Болих
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
