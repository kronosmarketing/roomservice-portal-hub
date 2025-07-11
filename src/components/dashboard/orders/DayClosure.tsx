
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { DoorClosed } from "lucide-react";
import { Order, DayStats } from "./types";
import { useDayClosure } from "./closure/useDayClosure";
import ClosureConfirmation from "./closure/ClosureConfirmation";
import ClosureResults from "./closure/ClosureResults";

interface DayClosureProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  onOrdersChange: (orders: Order[]) => void;
  onDayStatsChange: (stats: DayStats) => void;
}

const DayClosure = ({ isOpen, onClose, hotelId, onOrdersChange, onDayStatsChange }: DayClosureProps) => {
  const [hotelName, setHotelName] = useState('');

  const {
    loading,
    closureData,
    performDayClosure,
    handleReprint,
    handleDownload
  } = useDayClosure({
    hotelId,
    hotelName,
    onOrdersChange,
    onDayStatsChange
  });

  useEffect(() => {
    const getHotelName = async () => {
      if (!hotelId) return;
      
      try {
        const { data: hotelData } = await supabase
          .from('hotel_user_settings')
          .select('hotel_name')
          .eq('id', hotelId)
          .single();

        if (hotelData) {
          setHotelName(hotelData.hotel_name);
        }
      } catch (error) {
        console.error('Error obteniendo nombre del hotel:', error);
      }
    };

    if (isOpen) {
      getHotelName();
    }
  }, [isOpen, hotelId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorClosed className="h-5 w-5" />
            Cierre Z del Día
          </DialogTitle>
        </DialogHeader>

        {closureData ? (
          <ClosureResults
            closureData={closureData}
            onDownload={handleDownload}
            onReprint={handleReprint}
            onClose={onClose}
          />
        ) : (
          <ClosureConfirmation
            onConfirm={performDayClosure}
            onCancel={onClose}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DayClosure;
