"use client";
import { useParams } from "next/navigation";
import OrderComponent from "@/app/component/order";

export default function OrderPage() {
  const params = useParams();
  const orderId = params?.orderId;

  if (!orderId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p>Order ID is required.</p>
        </div>
      </div>
    );
  }

  return <OrderComponent orderId={orderId} />;
}
