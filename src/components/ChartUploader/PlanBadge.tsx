
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap } from 'lucide-react';

interface Usage {
  subscription_tier: string;
}

interface PlanBadgeProps {
  usage: Usage | null;
}

const PlanBadge = ({ usage }: PlanBadgeProps) => {
  if (!usage) return null;
  
  switch (usage.subscription_tier) {
    case 'pro':
      return (
        <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-400/10 text-xs">
          <Crown className="h-3 w-3 mr-1" />
          Pro
        </Badge>
      );
    case 'starter':
      return (
        <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-400/10 text-xs">
          <Star className="h-3 w-3 mr-1" />
          Starter
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-400 border-gray-400 bg-gray-400/10 text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Free
        </Badge>
      );
  }
};

export default PlanBadge;
