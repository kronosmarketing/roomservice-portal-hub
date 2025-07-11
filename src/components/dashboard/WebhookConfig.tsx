
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Check, AlertCircle } from "lucide-react";

const WebhookConfig = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar si el webhook está configurado
    checkWebhookStatus();
  }, []);

  const checkWebhookStatus = async () => {
    try {
      // Hacer una llamada de prueba para verificar si el webhook está configurado
      const response = await fetch('/api/check-webhook-config');
      setIsConfigured(response.ok);
    } catch (error) {
      console.log('Webhook not configured yet');
      setIsConfigured(false);
    }
  };

  const handleSaveWebhook = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL válida del webhook",
        variant: "destructive"
      });
      return;
    }

    // Validar que la URL sea la correcta
    const expectedUrl = 'https://n8n-n8n.mdrxie.easypanel.host/webhook/e6ecad36-8a3e-4cc2-8614-849702ac3eb5';
    
    if (webhookUrl.trim() === expectedUrl) {
      toast({
        title: "Webhook Configurado",
        description: "La URL del webhook ha sido configurada correctamente",
      });
      setIsConfigured(true);
    } else {
      toast({
        title: "URL Incorrecta",
        description: "La URL del webhook no coincide con la esperada",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración del Webhook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
          <span className={isConfigured ? "text-green-600" : "text-orange-600"}>
            {isConfigured ? "Webhook configurado correctamente" : "Webhook no configurado"}
          </span>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">URL del Webhook:</label>
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://n8n-n8n.mdrxie.easypanel.host/webhook/e6ecad36-8a3e-4cc2-8614-849702ac3eb5"
            className="font-mono text-sm"
          />
        </div>
        
        <Button onClick={handleSaveWebhook} className="w-full">
          Guardar Configuración
        </Button>
        
        <div className="text-xs text-gray-500 mt-2">
          <p><strong>URL Esperada:</strong></p>
          <p className="font-mono bg-gray-100 p-2 rounded text-xs break-all">
            https://n8n-n8n.mdrxie.easypanel.host/webhook/e6ecad36-8a3e-4cc2-8614-849702ac3eb5
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookConfig;
