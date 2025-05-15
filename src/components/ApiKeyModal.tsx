
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (apiKey: string) => void;
}

const ApiKeyModal = ({ open, onOpenChange, onSave }: ApiKeyModalProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    onSave(apiKey);
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-chart-card border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your OpenAI API key to enable chart analysis. Your key is stored locally on your device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              placeholder="Enter your OpenAI API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="text-xs text-gray-400">
            <p>To get your API key:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">OpenAI Platform</a></li>
              <li>Create or sign in to your account</li>
              <li>Go to API keys in your account settings</li>
              <li>Create a new API key</li>
            </ol>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-gray-600 text-white hover:bg-gray-800">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal;
