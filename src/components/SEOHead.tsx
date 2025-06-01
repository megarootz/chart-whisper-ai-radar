
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updatePageMeta, getPageSEOData, generateDynamicSEO } from '@/utils/seoUtils';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  dynamicContent?: {
    pageType: string;
    mainTopic?: string;
    analysisResult?: any;
    chartPair?: string;
  };
}

const SEOHead = ({ title, description, keywords, url, dynamicContent }: SEOHeadProps) => {
  const location = useLocation();

  useEffect(() => {
    if (title && description && keywords) {
      updatePageMeta(title, description, keywords, url);
    } else if (dynamicContent) {
      const dynamicSEO = generateDynamicSEO(dynamicContent);
      updatePageMeta(dynamicSEO.title, dynamicSEO.description, dynamicSEO.keywords, url);
    } else {
      const seoData = getPageSEOData(location.pathname);
      updatePageMeta(seoData.title, seoData.description, seoData.keywords, seoData.url);
    }
  }, [title, description, keywords, url, location.pathname, dynamicContent]);

  return null;
};

export default SEOHead;
