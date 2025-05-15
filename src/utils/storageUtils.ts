
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

// Create a bucket for chart images if it doesn't exist
export const initializeStorage = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(bucket => bucket.name === 'chart_images')) {
    const { error } = await supabase.storage.createBucket('chart_images', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
    });
    
    if (error) {
      console.error('Error creating storage bucket:', error);
    }
  }
};

// Upload a file to Supabase storage
export const uploadFile = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${uuidv4()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('chart_images')
    .upload(fileName, file);
  
  if (error) {
    throw error;
  }
  
  const { data: urlData } = supabase.storage
    .from('chart_images')
    .getPublicUrl(fileName);
  
  return urlData.publicUrl;
};

// Delete a file from Supabase storage
export const deleteFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('chart_images')
    .remove([filePath]);
  
  if (error) {
    throw error;
  }
  
  return true;
};
