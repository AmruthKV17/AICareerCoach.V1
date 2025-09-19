"use client"

import { useState } from 'react';
import VapiWidget from './VapiWidget';
import { QAPair } from '@/lib/exportUtils';

interface InterviewExportDemoProps {
  apiKey: string;
  assistantId?: string;
}

export default function InterviewExportDemo({ apiKey, assistantId }: InterviewExportDemoProps) {
  const [exportedData, setExportedData] = useState<QAPair[]>([]);
  const [exportHistory, setExportHistory] = useState<string[]>([]);

  const handleExport = (qaPairs: QAPair[]) => {
    setExportedData(qaPairs);
    const timestamp = new Date().toLocaleString();
    setExportHistory(prev => [...prev, `Exported ${qaPairs.length} QA pairs at ${timestamp}`]);
    console.log('QA Pairs exported:', qaPairs);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Export History */}
      {exportHistory.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-4">
          <h3 className="font-semibold text-blue-800">Export History</h3>
          <ul className="text-sm text-blue-700 mt-2">
            {exportHistory.map((entry, index) => (
              <li key={index}>• {entry}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Exported Data Preview */}
      {exportedData.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4">
          <h3 className="font-semibold text-green-800">Last Exported Data Preview</h3>
          <p className="text-sm text-green-700 mt-1">
            {exportedData.length} QA pairs ready for use
          </p>
          <div className="mt-2 text-xs text-green-600">
            <strong>Sample:</strong> {exportedData[0]?.question.substring(0, 50)}...
          </div>
        </div>
      )}

      {/* VapiWidget with export functionality */}
      <VapiWidget
        apiKey={apiKey}
        assistantId={assistantId}
        autoExport={true}
        exportFormat="json"
        onExport={handleExport}
      />
    </div>
  );
}
