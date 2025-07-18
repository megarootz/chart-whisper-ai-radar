import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkIcon, TrendingUp, TrendingDown, Clock, Target, StopCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Signal {
  id: string;
  pair: string;
  timeframe: string;
  type: "BUY" | "SELL";
  entry: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  timestamp: Date;
  status: "ACTIVE" | "TP_HIT" | "SL_HIT";
  isBookmarked?: boolean;
}

const mockSignals: Signal[] = [
  {
    id: "1",
    pair: "EURUSD",
    timeframe: "H1",
    type: "BUY",
    entry: 1.0850,
    takeProfit: 1.0920,
    stopLoss: 1.0780,
    confidence: 85,
    timestamp: new Date(),
    status: "ACTIVE"
  },
  {
    id: "2",
    pair: "GBPJPY",
    timeframe: "M15",
    type: "SELL",
    entry: 195.45,
    takeProfit: 194.80,
    stopLoss: 196.10,
    confidence: 92,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: "ACTIVE"
  },
  {
    id: "3",
    pair: "USDJPY",
    timeframe: "H4",
    type: "BUY",
    entry: 150.25,
    takeProfit: 151.00,
    stopLoss: 149.50,
    confidence: 78,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "TP_HIT"
  }
];

const SignalPage = () => {
  const [selectedPair, setSelectedPair] = useState<string>("ALL");
  const [bookmarkedSignals, setBookmarkedSignals] = useState<Set<string>>(new Set());

  const pairs = ["ALL", "EURUSD", "GBPUSD", "GBPJPY", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD"];
  
  const activeSignals = mockSignals.filter(signal => signal.status === "ACTIVE");
  const completedSignals = mockSignals.filter(signal => signal.status !== "ACTIVE");
  
  const filteredActiveSignals = selectedPair === "ALL" 
    ? activeSignals 
    : activeSignals.filter(signal => signal.pair === selectedPair);

  const toggleBookmark = (signalId: string) => {
    const newBookmarks = new Set(bookmarkedSignals);
    if (newBookmarks.has(signalId)) {
      newBookmarks.delete(signalId);
    } else {
      newBookmarks.add(signalId);
    }
    setBookmarkedSignals(newBookmarks);
  };

  const winRate = completedSignals.length > 0 
    ? (completedSignals.filter(s => s.status === "TP_HIT").length / completedSignals.length * 100).toFixed(1)
    : "0";

  const SignalCard = ({ signal, showBookmark = true }: { signal: Signal; showBookmark?: boolean }) => (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{signal.pair}</Badge>
            <Badge variant="secondary">{signal.timeframe}</Badge>
            <Badge 
              variant={signal.type === "BUY" ? "default" : "destructive"}
              className={cn(
                "flex items-center gap-1",
                signal.type === "BUY" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
              )}
            >
              {signal.type === "BUY" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {signal.type}
            </Badge>
          </div>
          {showBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleBookmark(signal.id)}
              className={cn(
                "h-8 w-8 p-0",
                bookmarkedSignals.has(signal.id) && "text-yellow-500"
              )}
            >
              <BookmarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full" />
              Entry
            </div>
            <div className="font-mono font-medium">{signal.entry}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3 text-emerald-500" />
              Take Profit
            </div>
            <div className="font-mono font-medium text-emerald-600">{signal.takeProfit}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-1">
              <StopCircle className="h-3 w-3 text-red-500" />
              Stop Loss
            </div>
            <div className="font-mono font-medium text-red-600">{signal.stopLoss}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {signal.timestamp.toLocaleTimeString()}
          </div>
          <Badge variant="outline" className="text-xs">
            {signal.confidence}% confidence
          </Badge>
        </div>
        
        {signal.status !== "ACTIVE" && (
          <Badge 
            variant={signal.status === "TP_HIT" ? "default" : "destructive"}
            className={cn(
              "w-full justify-center",
              signal.status === "TP_HIT" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            )}
          >
            {signal.status === "TP_HIT" ? "Take Profit Hit ✓" : "Stop Loss Hit ✗"}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 pb-20 lg:pb-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Trading Signals
            </h1>
            <p className="text-muted-foreground">Neural network powered forex signals</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Signals</p>
                    <p className="text-2xl font-bold text-primary">{activeSignals.length}</p>
                  </div>
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Radio className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold text-emerald-500">{winRate}%</p>
                  </div>
                  <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bookmarked</p>
                    <p className="text-2xl font-bold text-yellow-500">{bookmarkedSignals.size}</p>
                  </div>
                  <div className="h-8 w-8 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <BookmarkIcon className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Filter by pair:</span>
                <Select value={selectedPair} onValueChange={setSelectedPair}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pairs.map((pair) => (
                      <SelectItem key={pair} value={pair}>
                        {pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Signals Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Signals</TabsTrigger>
              <TabsTrigger value="history">Signal History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {filteredActiveSignals.length > 0 ? (
                <div className="grid gap-4">
                  {filteredActiveSignals.map((signal) => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Signals</h3>
                    <p className="text-muted-foreground">
                      {selectedPair === "ALL" 
                        ? "No signals are currently active. New signals will appear here when detected."
                        : `No active signals for ${selectedPair}. Try selecting a different pair.`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              {completedSignals.length > 0 ? (
                <div className="grid gap-4">
                  {completedSignals.map((signal) => (
                    <SignalCard key={signal.id} signal={signal} showBookmark={false} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Signal History</h3>
                    <p className="text-muted-foreground">
                      Completed signals will appear here once they hit their take profit or stop loss levels.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SignalPage;