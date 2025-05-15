
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
      
      <main className="flex-grow py-6 px-0 md:px-6 pb-24">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 px-4 md:px-0">
            <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account and settings</p>
          </div>
          
          <div className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden mx-4 md:mx-0">
            <div className="p-5 flex items-center">
              <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mr-4">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-gray-400">{user?.email || 'No email available'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-gray-400 text-sm px-4 md:px-0">
            <p>ForexRadar7 v1.0.0</p>
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default ProfilePage;
