import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Settings, Database, Shield, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  updated_at: string;
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Default settings structure
  const defaultSettings = {
    system_maintenance: {
      enabled: false,
      message: "El sistema se encuentra en mantenimiento. Disculpe las molestias."
    },
    notifications: {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true
    },
    security: {
      session_timeout: 3600,
      max_login_attempts: 5,
      password_min_length: 8
    },
    features: {
      allow_image_upload: true,
      max_file_size_mb: 10,
      allowed_file_types: ["jpg", "jpeg", "png", "pdf"]
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value || defaultSettings[key as keyof typeof defaultSettings];
  };

  const updateSetting = async (key: string, value: any, description?: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description || null
        });

      if (error) throw error;

      await loadSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const handleMaintenanceModeToggle = async (enabled: boolean) => {
    setSaving(true);
    try {
      const maintenanceSettings = getSetting('system_maintenance');
      await updateSetting('system_maintenance', {
        ...maintenanceSettings,
        enabled
      }, 'Configuración del modo de mantenimiento del sistema');

      toast({
        title: "Éxito",
        description: `Modo mantenimiento ${enabled ? 'activado' : 'desactivado'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el modo mantenimiento.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (type: string, enabled: boolean) => {
    setSaving(true);
    try {
      const notificationSettings = getSetting('notifications');
      await updateSetting('notifications', {
        ...notificationSettings,
        [`${type}_enabled`]: enabled
      }, 'Configuración de notificaciones del sistema');

      toast({
        title: "Éxito",
        description: `Notificaciones ${type} ${enabled ? 'activadas' : 'desactivadas'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de notificaciones.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityUpdate = async (field: string, value: number) => {
    setSaving(true);
    try {
      const securitySettings = getSetting('security');
      await updateSetting('security', {
        ...securitySettings,
        [field]: value
      }, 'Configuración de seguridad del sistema');

      toast({
        title: "Éxito",
        description: "Configuración de seguridad actualizada.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración de seguridad.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const maintenanceSettings = getSetting('system_maintenance');
  const notificationSettings = getSetting('notifications');
  const securitySettings = getSetting('security');
  const featureSettings = getSetting('features');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando configuraciones...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Modo Mantenimiento</span>
          </CardTitle>
          <CardDescription>
            Activa el modo mantenimiento para realizar actualizaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Estado del Sistema</Label>
              <div className="text-sm text-gray-500">
                Controla el acceso global al sistema
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={maintenanceSettings?.enabled || false}
                onCheckedChange={handleMaintenanceModeToggle}
                disabled={saving}
              />
              <Badge variant={maintenanceSettings?.enabled ? "destructive" : "default"}>
                {maintenanceSettings?.enabled ? 'Mantenimiento' : 'Operativo'}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Mensaje de Mantenimiento</Label>
            <Textarea
              id="maintenance-message"
              value={maintenanceSettings?.message || ''}
              onChange={(e) => {
                // For now, just show the change - you could implement auto-save here
              }}
              placeholder="Mensaje que verán los usuarios durante el mantenimiento"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Configuración de Notificaciones</span>
          </CardTitle>
          <CardDescription>
            Configura los tipos de notificaciones habilitadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones por Email</Label>
              <div className="text-sm text-gray-500">
                Enviar notificaciones importantes por correo electrónico
              </div>
            </div>
            <Switch
              checked={notificationSettings?.email_enabled || false}
              onCheckedChange={(enabled) => handleNotificationToggle('email', enabled)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones SMS</Label>
              <div className="text-sm text-gray-500">
                Enviar notificaciones urgentes por SMS
              </div>
            </div>
            <Switch
              checked={notificationSettings?.sms_enabled || false}
              onCheckedChange={(enabled) => handleNotificationToggle('sms', enabled)}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones Push</Label>
              <div className="text-sm text-gray-500">
                Notificaciones en tiempo real en la aplicación
              </div>
            </div>
            <Switch
              checked={notificationSettings?.push_enabled || false}
              onCheckedChange={(enabled) => handleNotificationToggle('push', enabled)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Configuración de Seguridad</span>
          </CardTitle>
          <CardDescription>
            Parámetros de seguridad y autenticación del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Timeout de Sesión (segundos)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={securitySettings?.session_timeout || 3600}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value > 0) {
                    handleSecurityUpdate('session_timeout', value);
                  }
                }}
                min="300"
                max="86400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-attempts">Máx. Intentos de Login</Label>
              <Input
                id="max-attempts"
                type="number"
                value={securitySettings?.max_login_attempts || 5}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value > 0) {
                    handleSecurityUpdate('max_login_attempts', value);
                  }
                }}
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-length">Long. Mín. Contraseña</Label>
              <Input
                id="password-length"
                type="number"
                value={securitySettings?.password_min_length || 8}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value > 0) {
                    handleSecurityUpdate('password_min_length', value);
                  }
                }}
                min="6"
                max="32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Información del Sistema</span>
          </CardTitle>
          <CardDescription>
            Estado actual y estadísticas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Activo</div>
              <div className="text-sm text-gray-500">Estado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{settings.length}</div>
              <div className="text-sm text-gray-500">Configuraciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">v1.0.0</div>
              <div className="text-sm text-gray-500">Versión</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;