
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

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

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    
    // Check if the API key has the expected format for OpenRouter
    if (!apiKey.trim().startsWith('sk-or-')) {
      setError('Invalid OpenRouter API key format. Keys should start with "sk-or-"');
      return;
    }
    
    onSave(apiKey.trim());
    onOpenChange(false);
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
              placeholder="sk-or-v1-..."
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
