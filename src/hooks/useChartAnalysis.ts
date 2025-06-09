
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AnalysisResultData, MarketFactor, ChartPattern, PriceLevel, TradingSetup } from '@/components/AnalysisResult';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { formatTradingPair } from '@/utils/tradingPairUtils';

export const useChartAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setLatestAnalysis, addToHistory } = useAnalysis();
  const { incrementUsage, checkUsageLimits } = useSubscription();

  // Save analysis to database with client timestamp
  const saveAnalysisToDatabase = async (analysisData: AnalysisResultData) => {
    try {
      if (!user) {
        console.log("❌ User not logged in, cannot save analysis");
        return;
      }
      
      console.log("💾 Saving analysis to database for user:", user.id, user.email);
      
      // Add client timestamp to analysis data
      const analysisWithTimestamp = {
        ...analysisData,
        created_at: new Date().toISOString()
      };
      
      // Convert AnalysisResultData to a JSON-compatible object
      const analysisDataJson: Json = JSON.parse(JSON.stringify(analysisWithTimestamp));
      
      const { data, error } = await supabase
        .from('chart_analyses')
        .insert({
          user_id: user.id,
          analysis_data: analysisDataJson,
          pair_name: analysisData.pairName,
          timeframe: analysisData.timeframe,
          chart_url: null,
          created_at: analysisWithTimestamp.created_at
        })
        .select()
        .single();
      
      if (error) {
        console.error("❌ Error saving analysis to database:", error);
        toast({
          title: "Error",
          description: "Failed to save analysis to history",
          variant: "destructive",
        });
      } else {
        console.log("✅ Analysis saved to database successfully", data);
        
        if (data) {
          addToHistory({
            id: data.id,
            created_at: data.created_at,
            pairName: analysisData.pairName,
            timeframe: analysisData.timeframe,
            overallSentiment: analysisData.overallSentiment,
            marketAnalysis: analysisData.marketAnalysis
          });
        }
        
        toast({
          title: "Success",
          description: "Analysis saved to your history",
          variant: "default",
        });
      }
    } catch (err) {
      console.error("❌ Error in saveAnalysisToDatabase:", err);
      toast({
        title: "Error",
        description: "Failed to save analysis to history",
        variant: "destructive",
      });
    }
  };

  // Validate image file
  const validateImageFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image file (PNG, JPG, JPEG)",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (max 10MB)
    const maxSizeInMB = 10;
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: `Please upload an image smaller than ${maxSizeInMB}MB`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const analyzeChart = async (file: File, pairName: string, timeframe: string) => {
    try {
      setIsAnalyzing(true);
      
      // CRITICAL: Check authentication first
      if (!user) {
        console.error('❌ AUTHENTICATION REQUIRED: User must be logged in to analyze charts');
        toast({
          title: "Authentication Required",
          description: "You must be logged in to analyze charts. Please sign in first.",
          variant: "destructive",
        });
        return;
      }

      // Validate the image file
      if (!validateImageFile(file)) {
        return;
      }

      console.log('🔍 Starting OpenRouter GPT-4o-mini chart analysis for authenticated user:', user.id, 'email:', user.email);
      console.log('📊 Analysis parameters:', { 
        pairName, 
        timeframe, 
        fileName: file.name, 
        fileSize: Math.round(file.size / 1024) + "KB",
        fileType: file.type 
      });

      // Check usage limits BEFORE proceeding
      console.log('📊 Checking usage limits before analysis...');
      const usageData = await checkUsageLimits();
      console.log('📊 Current usage status:', usageData);
      
      if (usageData) {
        console.log('📊 Detailed usage check:', {
          tier: usageData.subscription_tier,
          daily: `${usageData.daily_count}/${usageData.daily_limit}`,
          monthly: `${usageData.monthly_count}/${usageData.monthly_limit}`,
          can_analyze: usageData.can_analyze,
          daily_remaining: usageData.daily_remaining,
          monthly_remaining: usageData.monthly_remaining
        });

        if (!usageData.can_analyze) {
          console.log('❌ Usage limit reached - cannot analyze');
          toast({
            title: "Usage Limit Reached",
            description: `You've reached your analysis limit. Daily: ${usageData.daily_count}/${usageData.daily_limit}, Monthly: ${usageData.monthly_count}/${usageData.monthly_limit}`,
            variant: "destructive",
          });
          return;
        }

        if (usageData.daily_count >= usageData.daily_limit) {
          console.log('❌ Daily limit specifically reached');
          toast({
            title: "Daily Limit Reached",
            description: `You've used all ${usageData.daily_limit} analyses for today. Please wait until tomorrow or upgrade your plan.`,
            variant: "destructive",
          });
          return;
        }

        if (usageData.monthly_count >= usageData.monthly_limit) {
          console.log('❌ Monthly limit specifically reached');
          toast({
            title: "Monthly Limit Reached",
            description: `You've used all ${usageData.monthly_limit} analyses for this month. Please upgrade your plan.`,
            variant: "destructive",
          });
          return;
        }
      }
      
      console.log('✅ Usage limits check passed, proceeding with OpenRouter GPT-4o-mini analysis');
      
      // Convert image to base64
      console.log('🔄 Converting image to base64...');
      const base64Image = await fileToBase64(file);
      console.log('✅ Base64 conversion complete, length:', base64Image.length, 'characters');
      
      // Validate base64 image format
      if (!base64Image.startsWith('data:image/')) {
        throw new Error('Invalid image format after base64 conversion');
      }
      
      console.log("🤖 Calling OpenRouter GPT-4o-mini Supabase Edge Function to analyze chart");
      console.log('📤 Sending data:', {
        pairName,
        timeframe,
        base64Length: base64Image.length,
        hasValidImageHeader: base64Image.startsWith('data:image/'),
        imageType: file.type
      });
      
      // Call our OpenRouter GPT-4o-mini Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("analyze-chart", {
        body: {
          base64Image,
          pairName,
          timeframe
        }
      });
      
      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from OpenRouter GPT-4o-mini analysis function');
      }

      console.log("✅ OpenRouter GPT-4o-mini edge function response received");
      console.log('📥 Raw response type:', typeof data);
      
      // Parse the API response
      const responseData = data as any;
      
      if (!responseData.choices || responseData.choices.length === 0) {
        console.error('❌ Invalid response structure:', responseData);
        throw new Error('No response content from OpenRouter GPT-4o-mini API');
      }

      // Get the raw analysis text as requested (no formatting changes)
      const rawAnalysisText = responseData.choices[0].message.content || '';
      console.log("📝 OpenRouter GPT-4o-mini Raw Analysis:", rawAnalysisText.substring(0, 300) + "...");
      
      // Validate analysis content
      if (!rawAnalysisText.trim()) {
        throw new Error('Empty analysis received from OpenRouter API');
      }
      
      // Create a simple analysis data structure with raw text
      const analysisData: AnalysisResultData = {
        pairName: formatTradingPair(pairName),
        timeframe: timeframe,
        overallSentiment: 'neutral', // Default since we're showing raw output
        confidenceScore: 80,
        marketAnalysis: rawAnalysisText, // Raw output from GPT-4o-mini
        trendDirection: 'neutral',
        marketFactors: [],
        chartPatterns: [],
        priceLevels: [],
        tradingInsight: rawAnalysisText // Show raw output in both sections
      };
      
      console.log("🎯 Raw analysis data prepared:", { 
        pairName: analysisData.pairName, 
        timeframe: analysisData.timeframe,
        analysisLength: rawAnalysisText.length
      });
      
      // CRITICAL: Increment usage count AFTER successful analysis
      console.log('📈 OpenRouter analysis successful, incrementing usage count...');
      try {
        console.log('📈 Current user state:', { id: user.id, email: user.email, isAuthenticated: !!user });
        
        // Double-check user is still authenticated
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          console.error('❌ User session expired during analysis');
          throw new Error('User session expired. Please sign in again.');
        }
        
        const updatedUsage = await incrementUsage();
        
        if (updatedUsage) {
          console.log('✅ Usage incremented successfully:', {
            daily: `${updatedUsage.daily_count}/${updatedUsage.daily_limit}`,
            monthly: `${updatedUsage.monthly_count}/${updatedUsage.monthly_limit}`,
            tier: updatedUsage.subscription_tier,
            can_analyze: updatedUsage.can_analyze
          });
        } else {
          console.error('❌ incrementUsage returned null/undefined');
          toast({
            title: "Usage Count Warning", 
            description: "Analysis completed but usage count may not have updated. Please refresh the page.",
            variant: "destructive",
          });
        }
      } catch (usageError) {
        console.error('❌ CRITICAL Error incrementing usage:', usageError);
        toast({
          title: "Usage Count Error", 
          description: "Analysis completed but usage count failed to update. Please contact support if this continues.",
          variant: "destructive",
        });
      }
      
      // Save the analysis result
      setAnalysisResult(analysisData);
      
      // Update the latest analysis in the context
      setLatestAnalysis(analysisData);
      
      // Save the analysis to Supabase
      await saveAnalysisToDatabase(analysisData);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed the ${analysisData.pairName} chart with OpenRouter GPT-4o-mini`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("❌ Error analyzing chart with OpenRouter:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the chart. Please try again.",
        variant: "destructive",
      });
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        console.log('📄 File converted to base64:', {
          originalSize: file.size + " bytes",
          base64Length: result.length + " characters",
          compressionRatio: (result.length / file.size).toFixed(2)
        });
        resolve(result);
      };
      reader.onerror = error => {
        console.error('❌ Error converting file to base64:', error);
        reject(error);
      };
    });
  };

  return {
    isAnalyzing,
    analysisResult,
    analyzeChart,
    showApiKeyModal: false,
    setShowApiKeyModal: () => {},
    saveApiKey: () => {},
  };
};
