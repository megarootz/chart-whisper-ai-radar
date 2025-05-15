
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfilePage = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-chart-bg flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-6 pb-24">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account and settings</p>
          </div>
          
          <div className="bg-chart-card border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-6 flex items-center">
              <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mr-4">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-white">Guest User</h2>
                <p className="text-gray-400">guest@example.com</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>ForexRadar7 v1.0.0</p>
          </div>
        </div>
      </main>
      
      {!isMobile && <Footer />}
    </div>
  );
};

export default ProfilePage;
