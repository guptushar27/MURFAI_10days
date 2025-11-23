"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Trash2 } from "lucide-react"

interface Order {
  id: string
  timestamp: string
  drinkType: string
  size: string
  milk: string
  extras: string[]
  name: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedOrders = JSON.parse(localStorage.getItem("baristaOrders") || "[]")
    setOrders(
      savedOrders.sort((a: Order, b: Order) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    )
  }, [])

  const downloadOrder = (order: Order) => {
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(order, null, 2)))
    element.setAttribute("download", `${order.id}.json`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const deleteOrder = (id: string) => {
    const updated = orders.filter((o) => o.id !== id)
    setOrders(updated)
    localStorage.setItem("baristaOrders", JSON.stringify(updated))
  }

  if (!mounted) return null

  return (
    <div className="dark min-h-screen bg-background p-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4 bg-transparent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Ordering
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground text-sm mt-1">All your saved orders from Brewed Haven</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6 bg-card hover:bg-card/80 transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{order.name}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(order.timestamp).toLocaleString()}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded">
                    Completed
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <p>
                    <span className="font-medium text-foreground">Drink:</span>{" "}
                    <span className="text-muted-foreground">
                      {order.size} {order.drinkType} with {order.milk} milk
                    </span>
                  </p>
                  {order.extras.length > 0 && (
                    <p>
                      <span className="font-medium text-foreground">Extras:</span>{" "}
                      <span className="text-muted-foreground">{order.extras.join(", ")}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => downloadOrder(order)} size="sm" variant="outline" className="flex-1 text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    Download JSON
                  </Button>
                  <Button
                    onClick={() => deleteOrder(order.id)}
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-card border-dashed">
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Link href="/">
              <Button>Start an Order</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
