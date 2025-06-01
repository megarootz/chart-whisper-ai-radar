
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updatePageMeta, getPageSEOData } from '@/utils/seoUtils';

interface SEOHeadProps {
  title?: string;
  description?: string;
  url?: string;
}

const SEOHead = ({ title, description, url }: SEOHeadProps) => {
  const location = useLocation();

  useEffect(() => {
    if (title && description) {
      updatePageMeta(title, description, url);
    } else {
      const seoData = getPageSEOData(location.pathname);
      updatePageMeta(seoData.title, seoData.description, seoData.url);
    }
  }, [title, description, url, location.pathname]);

  return null;
};

export default SEOHead;
