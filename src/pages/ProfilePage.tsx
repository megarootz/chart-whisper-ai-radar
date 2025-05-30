import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className={`flex-grow pt-20 ${isMobile ? 'px-3 pb-20' : 'py-6 px-6 pb-24'}`} style={{ paddingTop: isMobile ? '80px' : '100px' }}>
        <div className={`${isMobile ? 'w-full' : 'container mx-auto max-w-4xl'}`}>
          <div className={`mb-4 md:mb-6 ${isMobile ? 'px-1' : 'px-0'}`}>
            <h1 
              className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2" 
              style={{ color: '#ffffff', fontWeight: 'bold', fontSize: isMobile ? '1.25rem' : '1.5rem' }}
            >
              Profile
            </h1>
            <p 
              className="text-gray-400 text-sm md:text-base"
              style={{ color: '#9ca3af' }}
            >
              Manage your account and settings
            </p>
          </div>
          
          <div className={`bg-chart-card border border-gray-700 rounded-lg overflow-hidden ${isMobile ? 'mx-0' : 'mx-0 md:mx-0'}`}>
            <div className="p-4 md:p-5 flex items-center">
              <div className="bg-primary/10 text-primary rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mr-3 md:mr-4">
                <User className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-medium text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-400 text-sm md:text-base">{user?.email || 'No email available'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-6 text-center text-gray-400 text-xs md:text-sm px-4 md:px-0">
            <p>ForexRadar7 v1.0.0</p>
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default ProfilePage;
