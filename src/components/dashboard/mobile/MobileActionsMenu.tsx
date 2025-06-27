
import { FileText, Printer, DoorClosed, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileActionsMenuProps {
  onShowReports: () => void;
  onPrintDailyReport: () => void;
  onShowDayClosure: () => void;
  onShowSearch: () => void;
  onShowDeleteDialog: () => void;
}

const MobileActionsMenu = ({
  onShowReports,
  onPrintDailyReport, 
  onShowDayClosure,
  onShowSearch,
  onShowDeleteDialog
}: MobileActionsMenuProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Desktop: mostrar botones individuales
    return (
      <div className="flex gap-3 flex-wrap">
        <Button 
          onClick={onShowReports}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Ver Informes
        </Button>
        <Button 
          onClick={onPrintDailyReport}
          variant="outline"
          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-300"
        >
          <span className="font-bold text-blue-600">X</span>
          Informe X
        </Button>
        <Button 
          onClick={onShowDayClosure}
          variant="outline"
          className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border-purple-300"
        >
          <span className="font-bold text-purple-600">Z</span>
          Cierre Z
        </Button>
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
  }

  // Mobile: mostrar menú desplegable
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Acciones
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
          <DoorClosed className="h-4 w-4 mr-2" />
          Cierre Z (Final)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowSearch} className="cursor-pointer">
          <Search className="h-4 w-4 mr-2" />
          Buscar Pedidos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onShowDeleteDialog} className="cursor-pointer text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar Pedido
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MobileActionsMenu;
