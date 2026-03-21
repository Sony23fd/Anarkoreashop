"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { emitNewOrder } from "@/lib/orderEvents"
import { getCurrentAdmin, logActivity } from "@/lib/auth"

export async function getOrders() {
  try {
    const orders = await db.order.findMany({
      where: {
        OR: [
          { statusId: null },
          { status: { isFinal: false } }
        ]
      },
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to fetch all orders:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}

export async function getCompletedOrders(days: number = 30) {
  try {
    const whereClause: any = {
      status: { isFinal: true }
    };

    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      whereClause.updatedAt = { gte: cutoffDate };
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { updatedAt: "desc" },
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to fetch completed orders:", error)
    return { success: false, error: "Failed to fetch completed orders" }
  }
}

export async function getOrderStatuses() {
  try {
    const statuses = await db.orderStatusType.findMany({
      orderBy: { createdAt: "asc" },
    })
    return { success: true, statuses }
  } catch (error) {
    console.error("Failed to fetch order statuses:", error)
    return { success: false, error: "Failed to fetch order statuses" }
  }
}

export async function getOrdersByAccount(accountNumber: string) {
  try {
    const orders = await db.order.findMany({
      where: { 
        accountNumber 
      },
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to fetch orders by account:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}
export async function createOrder(data: {
  customerName: string
  phoneNumber: string
  accountNumber: string
  deliveryAddress?: string
  deliveryInstructions?: string
  quantity: number
  totalAmount: number
  batchId: string
  wantsDelivery?: boolean
  transactionRef?: string  // shared ref for multi-item cart checkout
}) {
  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Get batch current state
      const batch = await tx.batch.findUnique({
        where: { id: data.batchId }
      });

      if (!batch) {
        throw new Error("Batch not found");
      }

      // 2. Create the order
      const defaultStatus = await tx.orderStatusType.findFirst({ where: { isDefault: true } as any });
      const transactionRef = data.transactionRef
        ?? `ANR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      const order = await tx.order.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.phoneNumber,
          accountNumber: data.accountNumber,
          deliveryAddress: data.deliveryAddress,
          quantity: data.quantity,
          batchId: data.batchId,
          wantsDelivery: data.wantsDelivery ?? false,
          paymentStatus: "PENDING",
          totalAmount: data.totalAmount,
          transactionRef,
          ...(defaultStatus?.id && { statusId: defaultStatus.id })
        } as any
      });

      // 3. Decrement remaining quantity (clamp to 0, don't auto-close)
      const newQty = Math.max(0, batch.remainingQuantity - data.quantity)
      await tx.batch.update({
        where: { id: data.batchId },
        data: { remainingQuantity: newQty } as any
      });

      return order;
    });

    revalidatePath("/admin/products")
    revalidatePath("/admin/orders")
    revalidatePath("/")

    // Emit grouped notification (800ms server-side debounce by transactionRef)
    try {
      const order = result as any
      const batch = await db.batch.findUnique({ where: { id: data.batchId }, include: { product: true } })
      emitNewOrder({
        transactionRef: (result as any).transactionRef || (result as any).id,
        customerName: data.customerName,
        customerPhone: data.phoneNumber,
        wantsDelivery: data.wantsDelivery ?? false,
        createdAt: new Date().toISOString(),
        totalAmount: data.totalAmount,
        item: {
          orderId: order.id,
          productName: batch?.product?.name ?? "Бараа",
          quantity: data.quantity,
          totalAmount: data.totalAmount,
          batchId: data.batchId,
        }
      })
    } catch { /* non-critical */ }

    return { success: true, order: JSON.parse(JSON.stringify(result)) }
  } catch (error: any) {
    console.error("Failed to create order:", error)
    return { success: false, error: error.message || "Failed to create order" }
  }
}

export async function addOrderToBatch(batchId: string, data: {
  customerName: string
  customerPhone: string
  accountNumber?: string
  quantity: number
  arrivalDate?: string
  deliveryDate?: string
  deliveryAddress?: string
  statusId?: string
  cargoFee?: number
}) {
  try {
    const result = await db.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId }
      });
      if (!batch) throw new Error("Batch not found");

      const defaultStatus = await tx.orderStatusType.findFirst();
      const statusId = data.statusId || defaultStatus?.id;

      // @ts-ignore
      const order = await tx.order.create({
        data: {
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          ...(data.accountNumber && { accountNumber: data.accountNumber }),
          ...(data.deliveryAddress && { deliveryAddress: data.deliveryAddress }),
          quantity: data.quantity,
          batchId: batchId,
          paymentStatus: "CONFIRMED", // Admin-added orders are automatically confirmed
          ...(statusId && { statusId: statusId }),
          ...(data.cargoFee !== undefined && { cargoFee: data.cargoFee }),
          ...(data.arrivalDate && { arrivalDate: new Date(data.arrivalDate) }),
          ...(data.deliveryDate && { deliveryDate: new Date(data.deliveryDate) }),
        }
      });

      return { order, categoryId: batch.categoryId };
    });

    revalidatePath(`/admin/orders/batch/${batchId}`)
    revalidatePath(`/admin/orders/category/${result.categoryId}`)
    revalidatePath("/admin/orders")
    return { success: true, order: JSON.parse(JSON.stringify(result.order)) }
  } catch (error: any) {
    console.error("Failed to add order to batch:", error)
    return { success: false, error: error.message || "Failed to add order to batch" }
  }
}

export async function searchOrders(query?: string) {
  try {
    const activeFilter = {
      OR: [
        { statusId: null },
        { status: { isFinal: false } }
      ]
    }
    const orders = await db.order.findMany({
      where: query ? {
        AND: [
          activeFilter,
          {
            OR: [
              { accountNumber: { contains: query, mode: 'insensitive' } },
              { customerPhone: { contains: query, mode: 'insensitive' } },
              { customerName: { contains: query, mode: 'insensitive' } },
              { batch: { product: { name: { contains: query, mode: 'insensitive' } } } },
            ]
          }
        ]
      } : activeFilter,
      include: {
        batch: {
          include: { product: true, category: true }
        },
        status: true
      },
      orderBy: { createdAt: "desc" },
    })
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) }
  } catch (error) {
    console.error("Failed to search orders:", error)
    return { success: false, error: "Failed to search orders" }
  }
}

export async function updateBatchOrderStatuses(batchId: string, statusId: string) {
  try {
    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: {
        orders: {
          include: { status: true }
        }
      }
    })
    
    if (!batch) return { success: false, error: "Batch not found" }

    const orderIdsToUpdate = batch.orders
      .filter((o: any) => o.paymentStatus === 'CONFIRMED' && !o.status?.isFinal)
      .map((o: any) => o.id)

    if (orderIdsToUpdate.length > 0) {
      await db.order.updateMany({
        where: { id: { in: orderIdsToUpdate } },
        data: { statusId }
      })
    }

    revalidatePath(`/admin/orders/batch/${batchId}`)
    revalidatePath("/admin/orders")
    
    return { success: true, count: orderIdsToUpdate.length }
  } catch (error: any) {
    console.error("Failed to update batch order statuses:", error)
    return { success: false, error: "Failed to update statuses" }
  }
}

export async function updateOrderStatus(orderId: string, statusId: string) {
  try {
    const order = await db.order.update({
      where: { id: orderId },
      data: { statusId }
    })
    revalidatePath("/admin/orders/search")
    return { success: true, order: JSON.parse(JSON.stringify(order)) }
  } catch (error) {
    console.error("Failed to update order status:", error)
    return { success: false, error: "Failed to update status" }
  }
}

export async function getQPayInvoiceForOrder(transactionRef: string) {
  try {
    const orders = await (db.order as any).findMany({
      where: { transactionRef }
    })
    
    if (!orders || orders.length === 0) return { success: false, error: "N/A" }

    // If already generated, return existing
    if (orders[0].qpayInvoiceId && orders[0].qpayQrText) {
      return { 
        success: true, 
        qpayQrText: orders[0].qpayQrText, 
        qpayUrls: orders[0].qpayUrls 
      }
    }

    // Otherwise generate new invoice
    const { createQPayInvoice } = await import("@/lib/qpay")
    const totalAmount = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0)
    
    if (totalAmount <= 0) return { success: false, error: "Amount is 0" }

    const invoiceRes = await createQPayInvoice({
      transactionRef,
      amount: totalAmount,
      description: `AnarKoreaShop - Order ${transactionRef}`
    })

    if (!invoiceRes.success || !invoiceRes.data) {
      return { success: false, error: invoiceRes.error }
    }

    const { invoice_id, qr_text, urls } = invoiceRes.data

    // Save to DB
    await (db.order as any).updateMany({
      where: { transactionRef },
      data: {
        qpayInvoiceId: invoice_id,
        qpayQrText: qr_text,
        qpayUrls: urls
      }
    })

    return { success: true, qpayQrText: qr_text, qpayUrls: urls }
  } catch (err: any) {
    console.error("Failed to generate QPay invoice:", err)
    return { success: false, error: err.message }
  }
}



/**
 * Customer requests home delivery from the track page.
 * Only allowed if the order's current status has isDeliverable=true.
 */
export async function requestDelivery(orderId: string, deliveryAddress: string) {
  try {
    const order = await (db.order as any).findUnique({
      where: { id: orderId },
      include: { status: true }
    })
    if (!order) return { success: false, error: "Захиалга олдсонгүй" }
    if (order.wantsDelivery) return { success: false, error: "Хүргэлт аль хэдийн захиалагдсан байна" }
    if (!order.status?.isDeliverable) {
      return { success: false, error: "Бараа одоогоор ирээгүй байна. Ирсний дараа хүргэлт захиалах боломжтой." }
    }
    await (db.order as any).update({
      where: { id: orderId },
      data: {
        wantsDelivery: true,
        deliveryAddress: deliveryAddress.trim()
      }
    })
    revalidatePath("/track")
    return { success: true }
  } catch (err: any) {
    console.error("requestDelivery error:", err)
    return { success: false, error: err.message }
  }
}

/**
 * Restore a completed order back to its default active status
 */
export async function restoreCompletedOrder(orderId: string) {
  try {
    const adminMode = await getCurrentAdmin()
    if (!adminMode) return { success: false, error: "Хандах эрхгүй" }

    const activeStatus = await db.orderStatusType.findFirst({
      where: { isDefault: true }
    })

    if (!activeStatus) {
      return { success: false, error: "Үндсэн идэвхтэй төлөв олдсонгүй" }
    }

    await db.order.update({
      where: { id: orderId },
      data: { statusId: activeStatus.id }
    })

    // Log the action
    await logActivity({
      userId: adminMode.id,
      userName: adminMode.name || "Сэргээгч Админ",
      userRole: adminMode.role,
      action: "Сэргээлээ",
      target: "Захиалга",
      detail: `Захиалга #${orderId} -г буцааж идэвхтэй төлөвт шилжүүллээ`,
      targetUrl: `/admin/orders/${orderId}`
    })

    revalidatePath("/admin/orders/completed")
    revalidatePath("/admin/orders")
    return { success: true }
  } catch(err: any) {
    console.error("restoreCompletedOrder error:", err)
    return { success: false, error: err.message }
  }
}