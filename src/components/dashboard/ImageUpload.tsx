
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image } from "lucide-react";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
}

const ImageUpload = ({ currentImageUrl, onImageUploaded, onImageRemoved }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      console.log('🖼️ Iniciando carga de imagen...');
      
      if (!event.target.files || event.target.files.length === 0) {
        console.log('❌ No se seleccionó archivo');
        return;
      }

      const file = event.target.files[0];
      console.log('📁 Archivo seleccionado:', { name: file.name, size: file.size, type: file.type });
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen debe ser menor a 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `recipes/${fileName}`;

      console.log('📤 Subiendo archivo:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Error al subir:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      console.log('✅ Imagen subida correctamente:', publicUrl);

      // Call the callback immediately
      onImageUploaded(publicUrl);
      
      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Error al subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input value to allow uploading the same file again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    console.log('🗑️ Eliminando imagen');
    onImageRemoved();
    toast({
      title: "Éxito",
      description: "Imagen eliminada",
    });
  };

  return (
    <div className="space-y-4">
      <Label>Imagen del Escandallo</Label>
      
      {currentImageUrl ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img 
              src={currentImageUrl} 
              alt="Recipe" 
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={handleRemoveImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
          <Image className="h-8 w-8 text-gray-400" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <Label htmlFor="image-upload" asChild>
          <Button 
            type="button" 
            variant="outline" 
            disabled={uploading}
            className="cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Subiendo...' : 'Subir Imagen'}
          </Button>
        </Label>
      </div>
    </div>
  );
};

export default ImageUpload;
