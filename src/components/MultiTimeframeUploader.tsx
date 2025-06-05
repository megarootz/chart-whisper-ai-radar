
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Clock } from 'lucide-react';

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: 'Daily' },
  { value: '1w', label: 'Weekly' },
  { value: '1M', label: 'Monthly' },
];

interface TimeframeChart {
  file: File;
  timeframe: string;
  previewUrl: string;
}

interface MultiTimeframeUploaderProps {
  charts: TimeframeChart[];
  onChartsChange: (charts: TimeframeChart[]) => void;
  maxCharts?: number;
}

const MultiTimeframeUploader = ({ charts, onChartsChange, maxCharts = 3 }: MultiTimeframeUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newCharts: TimeframeChart[] = [];
    
    files.slice(0, maxCharts - charts.length).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const newChart: TimeframeChart = {
            file,
            timeframe: '',
            previewUrl: reader.result as string,
          };
          newCharts.push(newChart);
          
          if (newCharts.length === files.length) {
            onChartsChange([...charts, ...newCharts]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeChart = (index: number) => {
    const updatedCharts = charts.filter((_, i) => i !== index);
    onChartsChange(updatedCharts);
  };

  const updateTimeframe = (index: number, timeframe: string) => {
    const updatedCharts = charts.map((chart, i) => 
      i === index ? { ...chart, timeframe } : chart
    );
    onChartsChange(updatedCharts);
  };

  const canAddMore = charts.length < maxCharts;

  return (
    <Card className="bg-chart-card border-gray-700">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-white font-semibold">Multi-Timeframe Chart Upload</h3>
          <span className="text-gray-400 text-sm">({charts.length}/{maxCharts})</span>
        </div>

        {/* Upload Area */}
        {canAddMore && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('multi-file-upload')?.click()}
          >
            <input
              id="multi-file-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-white mb-1">
              Drop chart images here or click to browse
            </p>
            <p className="text-gray-400 text-sm">
              Add up to {maxCharts - charts.length} more chart{maxCharts - charts.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Uploaded Charts */}
        {charts.length > 0 && (
          <div className="space-y-4">
            {charts.map((chart, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={chart.previewUrl}
                    alt={`Chart ${index + 1}`}
                    className="w-24 h-16 object-cover rounded border border-gray-600"
                  />
                  <div className="flex-1 space-y-2">
                    <Label className="text-white text-sm">
                      Chart {index + 1} Timeframe
                    </Label>
                    <Select value={chart.timeframe} onValueChange={(value) => updateTimeframe(index, value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {TIMEFRAMES.map((tf) => (
                          <SelectItem key={tf.value} value={tf.value} className="text-white hover:bg-gray-600">
                            {tf.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeChart(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Validation Messages */}
        {charts.length > 0 && (
          <div className="space-y-2">
            {charts.some(chart => !chart.timeframe) && (
              <p className="text-yellow-400 text-sm">
                Please select timeframes for all uploaded charts before analyzing.
              </p>
            )}
            {charts.length === maxCharts && (
              <p className="text-green-400 text-sm">
                Maximum number of charts uploaded. Ready for multi-timeframe analysis!
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiTimeframeUploader;
export type { TimeframeChart };
