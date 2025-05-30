
import { supabase } from '@/integrations/supabase/client';

// Note: These storage functions are no longer used in the application
// Images are converted to base64 for AI analysis but not stored permanently
// This saves storage space and improves user privacy

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

// DEPRECATED: Function to upload a file to the chart_images bucket
// This function is no longer used as we don't store images permanently
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
