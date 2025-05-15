
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (key: string) => void;
  title?: string;
  description?: string;
  helpLink?: string;
}

const ApiKeyModal = ({
  open,
  onOpenChange,
  onSave,
  title = "Enter API Key",
  description = "Please enter your API key to use the chart analysis feature",
  helpLink = "https://platform.openai.com/account/api-keys"
}: ApiKeyModalProps) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Pre-fill with saved API key if available
  useEffect(() => {
    if (open && user) {
      fetchApiKey();
    }
  }, [open, user]);

  const fetchApiKey = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('key_value')
        .eq('user_id', user.id)
        .eq('key_type', 'openrouter')
        .single();
      
      if (error) {
        console.log('No API key found or error fetching key:', error.message);
        return;
      }
      
      if (data && data.key_value) {
        setApiKey(data.key_value);
      }
    } catch (err) {
      console.error('Error fetching API key:', err);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to save an API key');
      return;
    }
    
    // Check if the API key has the expected format for OpenRouter
    // OpenRouter keys can start with either sk-or- (old format) or sk-ro- (new format)
    if (!apiKey.trim().startsWith('sk-or-') && !apiKey.trim().startsWith('sk-ro-')) {
      setError('Invalid OpenRouter API key format. Keys should start with "sk-or-" or "sk-ro-"');
      return;
    }
    
    try {
      // Save to Supabase with upsert (insert if not exists, update if exists)
      const { error: upsertError } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          key_type: 'openrouter',
          key_value: apiKey.trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key_type'
        });
      
      if (upsertError) {
        console.error('Error saving API key to database:', upsertError);
        setError('Failed to save API key to database');
        return;
      }
      
      // Also save to localStorage as a backup/cache
      localStorage.setItem('openrouter_api_key', apiKey.trim());
      
      console.log("API key saved successfully");
      toast({
        title: "API Key Saved",
        description: "Your OpenRouter API key has been saved successfully",
      });
      
      // Save the API key and close modal
      onSave(apiKey.trim());
      setError('');
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('An unexpected error occurred while saving the API key');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-chart-card border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-chart-text">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="api-key" className="text-white">API Key</Label>
          <div className="flex items-center mt-2 space-x-2">
            <Input
              id="api-key"
              className="flex-1 bg-gray-800 border-gray-700 text-white"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder="sk-or-v1-... or sk-ro-..."
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(helpLink, '_blank')}
              title="Get API Key"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-4 p-2 bg-blue-900/20 border border-blue-800/50 rounded-md">
            <p className="text-xs text-blue-300">
              Get your OpenRouter API key from <a href="https://openrouter.ai/keys" target="_blank" className="underline">openrouter.ai/keys</a>. 
              Keys typically start with 'sk-or-' or 'sk-ro-'.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;
