
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Clock } from 'lucide-react';

interface TimeframeChart {
  file: File;
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
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      Chart {index + 1}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Timeframe will be auto-detected by AI
                    </p>
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

        {/* Info Message */}
        {charts.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              AI will automatically detect timeframes from your chart images and provide comprehensive multi-timeframe analysis.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiTimeframeUploader;
export type { TimeframeChart };
