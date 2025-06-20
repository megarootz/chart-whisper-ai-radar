
import React from 'react';
import { Button } from '@/components/ui/button';

interface ButtonState {
  text: string;
  disabled: boolean;
}

interface UploadButtonProps {
  onClick: (e: React.FormEvent) => void;
  buttonState: ButtonState;
}

const UploadButton = ({ onClick, buttonState }: UploadButtonProps) => {
  return (
    <Button 
      type="submit" 
      onClick={onClick} 
      className="w-full" 
      disabled={buttonState.disabled}
    >
      {buttonState.text}
    </Button>
  );
};

export default UploadButton;
