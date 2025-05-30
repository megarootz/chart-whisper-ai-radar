
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          username: username.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col min-h-screen bg-chart-bg ${isMobile ? 'pb-24' : ''}`}>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-white">Loading profile...</p>
          </div>
        </main>
        {!isMobile && <Footer />}
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-chart-bg ${isMobile ? 'pb-24' : ''}`}>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-chart-text">Manage your account settings and preferences.</p>
          </div>

          <Card className="bg-chart-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-300" />
                </div>
                <div>
                  <h2 className="text-xl">Account Information</h2>
                  <p className="text-sm text-chart-text font-normal">{user?.email}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-700 border-gray-600 text-gray-400"
                />
                <p className="text-xs text-chart-text">Email cannot be changed</p>
              </div>

              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      {!isMobile && <Footer />}
    </div>
  );
};

export default ProfilePage;
