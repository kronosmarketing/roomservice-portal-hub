
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { FileText, Printer, Search, Trash2, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileActionsMenu from "../mobile/MobileActionsMenu";

interface OrdersActionsMenuProps {
  onShowReports: () => void;
  onPrintDailyReport: () => void;
  onShowDayClosure: () => void;
  onShowSearch: () => void;
  onShowDeleteDialog: () => void;
}

const OrdersActionsMenu = ({
  onShowReports,
  onPrintDailyReport,
  onShowDayClosure,
  onShowSearch,
  onShowDeleteDialog
}: OrdersActionsMenuProps) => {
  const isMobile = useIsMobile();

  const DesktopActionsMenu = () => (
    <div className="flex gap-3 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Acciones
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white z-50">
          <DropdownMenuItem onClick={onShowReports} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            Ver Informes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onPrintDailyReport} className="cursor-pointer">
            <Printer className="h-4 w-4 mr-2" />
            Informe X (Parcial)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShowDayClosure} className="cursor-pointer">
            <span className="h-4 w-4 mr-2 flex items-center justify-center font-bold text-purple-600">Z</span>
            Cierre Z (Final)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button 
        onClick={onShowSearch}
        variant="outline"
        className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-300"
      >
        <Search className="h-4 w-4" />
        Buscar Pedidos
      </Button>
      
      <Button 
        onClick={onShowDeleteDialog}
        variant="destructive"
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar Pedido
      </Button>
    </div>
  );

  return (
    <div className="flex gap-3 flex-wrap">
      {isMobile ? (
        <MobileActionsMenu 
          onShowReports={onShowReports}
          onPrintDailyReport={onPrintDailyReport}
          onShowDayClosure={onShowDayClosure}
          onShowSearch={onShowSearch}
          onShowDeleteDialog={onShowDeleteDialog}
        />
      ) : (
        <DesktopActionsMenu />
      )}
    </div>
  );
};

export default OrdersActionsMenu;
