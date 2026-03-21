import { getCompletedOrders } from "@/app/actions/order-actions"
import CompletedOrdersClient from "./CompletedOrdersClient"

export const dynamic = "force-dynamic"

export default async function CompletedOrdersPage({ searchParams }: { searchParams: { days?: string } }) {
  const days = searchParams.days ? parseInt(searchParams.days, 10) : 30;
  const { orders } = await getCompletedOrders(days);

  return <CompletedOrdersClient orders={orders || []} initialDays={days} />
}
