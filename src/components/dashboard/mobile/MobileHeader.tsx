
import { Button } from "@/components/ui/button";
import { LogOut, Mic, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileHeaderProps {
  hotelName: string;
  email: string;
  onLogout: () => void;
}

const MobileHeader = ({ hotelName, email, onLogout }: MobileHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-3">
        {isMobile ? (
          // Mobile Header
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="h-6 w-6 text-blue-400" />
              <h1 className="text-lg font-bold text-white">
                Marjor<span className="text-orange-500">AI</span>
              </h1>
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 p-2"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-white">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-800">{hotelName}</h3>
                    <p className="text-sm text-gray-600 break-all">{email}</p>
                  </div>
                  
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          // Desktop Header
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Mic className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">
                Marjor<span className="text-orange-500">AI</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-white/80 hidden sm:block">
                {hotelName} - {email}
              </span>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
