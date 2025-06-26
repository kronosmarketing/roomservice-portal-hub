
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OAuthButtonsProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const OAuthButtons = ({ loading, setLoading }: OAuthButtonsProps) => {
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al autenticar con Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleMicrosoftAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al autenticar con Microsoft",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
        onClick={handleGoogleAuth}
        disabled={loading}
      >
        <Mail className="h-4 w-4 mr-2" />
        Continuar con Google
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
        onClick={handleMicrosoftAuth}
        disabled={loading}
      >
        <Mail className="h-4 w-4 mr-2" />
        Continuar con Microsoft
      </Button>
    </div>
  );
};

export default OAuthButtons;
