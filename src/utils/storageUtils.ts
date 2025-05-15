
import { supabase } from '@/integrations/supabase/client';

export const initializeStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }
    
    // Check if chart_images bucket already exists
    const bucketExists = existingBuckets?.some(bucket => bucket.name === 'chart_images');
    
    // If bucket doesn't exist, create it
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket('chart_images', {
        public: true, // Make the bucket public so images can be viewed without authentication
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log('Storage bucket "chart_images" created successfully');
    } else {
      console.log('Storage bucket "chart_images" already exists');
    }
  } catch (error) {
    console.error('Error creating storage bucket:', error);
  }
};
