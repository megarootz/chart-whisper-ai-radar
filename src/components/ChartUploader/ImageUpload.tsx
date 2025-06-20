
import React from 'react';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  previewUrl: string | null;
  onFileChange: (file: File, preview: string) => void;
}

const ImageUpload = ({ previewUrl, onFileChange }: ImageUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        onFileChange(selectedFile, reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="chart-upload" className="text-white text-sm">Upload Chart Image</Label>
      <div className="border-2 border-dashed border-gray-700 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors">
        <input 
          type="file" 
          id="chart-upload" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <label htmlFor="chart-upload" className="cursor-pointer flex flex-col items-center justify-center">
          {previewUrl ? (
            <div className="w-full">
              <img 
                src={previewUrl} 
                alt="Chart preview" 
                className="max-h-[300px] mx-auto rounded-md mb-2 object-contain" 
              />
              <p className="text-sm text-chart-text">Click to change image</p>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-white font-medium">Drop your chart image here</p>
              <p className="text-sm text-chart-text mt-1">or click to browse files</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default ImageUpload;
