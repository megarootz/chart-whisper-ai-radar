
import { supabase } from '@/integrations/supabase/client';

export const initializeStorage = async (userId?: string) => {
  try {
    // Check if the bucket exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    // Check if chart_images bucket already exists
    const bucketExists = existingBuckets?.some(bucket => bucket.name === 'chart_images');
    
    // If bucket doesn't exist and user is authenticated, create it
    if (!bucketExists && userId) {
      const { error: createError } = await supabase.storage.createBucket('chart_images', {
        public: true, // Make the bucket public so images can be viewed without authentication
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('Storage bucket "chart_images" created successfully');
    } else if (bucketExists) {
      console.log('Storage bucket "chart_images" already exists');
    } else {
      console.log('User not authenticated, skipping bucket creation');
    }
    
    return true;
  } catch (error) {
    console.error('Error with storage bucket:', error);
    return false;
  }
};

// Function to upload a file to the chart_images bucket with proper owner assignment
export const uploadChartImage = async (file: File, userId: string) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to upload files');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('chart_images')
      .upload(fileName, file, {
        upsert: false,
        // Use 'metadata' instead of 'fileMetadata'
        metadata: { 
          owner: userId 
        }
      });
    
    if (error) {
      throw error;
    }
    
    const { data: urlData } = supabase.storage
      .from('chart_images')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload chart image:', error);
    throw error;
  }
};
