import { getCompletedOrders } from "@/app/actions/order-actions"
import CompletedOrdersClient from "./CompletedOrdersClient"

export const dynamic = "force-dynamic"

export default async function CompletedOrdersPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const p = await searchParams;
  const days = p.days ? parseInt(p.days, 10) : 30;
  const { orders } = await getCompletedOrders(days);

  return <CompletedOrdersClient orders={orders || []} initialDays={days} />
}
