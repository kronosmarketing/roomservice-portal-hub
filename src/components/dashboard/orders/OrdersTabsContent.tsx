
import { TabsContent } from "@/components/ui/tabs";
import { Order } from "./types";
import OrderCard from "./OrderCard";

interface OrdersTabsContentProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: string) => void;
  onCancelOrder: (orderId: string) => void;
  onPrintOrder: (order: Order) => void;
  showAllActions?: boolean;
  tabValue: string;
  emptyMessage: string;
}

const OrdersTabsContent = ({
  orders,
  onStatusChange,
  onCancelOrder,
  onPrintOrder,
  showAllActions = false,
  tabValue,
  emptyMessage
}: OrdersTabsContentProps) => {
  return (
    <TabsContent value={tabValue} className="mt-6">
      {orders.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
      ) : (
        orders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onStatusChange={onStatusChange}
            onCancelOrder={onCancelOrder}
            onPrintOrder={onPrintOrder}
            showAllActions={showAllActions}
          />
        ))
      )}
    </TabsContent>
  );
};

export default OrdersTabsContent;
