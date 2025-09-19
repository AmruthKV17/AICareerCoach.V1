export interface QAPair {
  question: string;
  answer: string;
}

export interface ExportOptions {
  format: 'json' | 'txt' | 'csv';
  includeTimestamp?: boolean;
  includeMetadata?: boolean;
}

export interface ExportMetadata {
  timestamp: string;
  totalQuestions: number;
  sessionDuration?: string;
}

export class QAExporter {
  static exportToJSON(qaPairs: QAPair[], options: ExportOptions = { format: 'json' }): string {
    const metadata: ExportMetadata = {
      timestamp: new Date().toISOString(),
      totalQuestions: qaPairs.length,
    };

    const exportData = {
      metadata,
      qaPairs,
    };

    return JSON.stringify(exportData, null, 2);
  }

  static exportToTXT(qaPairs: QAPair[], options: ExportOptions = { format: 'txt' }): string {
    const timestamp = new Date().toLocaleString();
    let content = `Interview QA Pairs Export\n`;
    content += `Generated: ${timestamp}\n`;
    content += `Total Questions: ${qaPairs.length}\n`;
    content += `${'='.repeat(50)}\n\n`;

    qaPairs.forEach((qa, index) => {
      content += `Q${index + 1}: ${qa.question}\n`;
      content += `A${index + 1}: ${qa.answer}\n\n`;
    });

    return content;
  }

  static exportToCSV(qaPairs: QAPair[], options: ExportOptions = { format: 'csv' }): string {
    let content = 'Question,Answer\n';
    
    qaPairs.forEach(qa => {
      const question = `"${qa.question.replace(/"/g, '""')}"`;
      const answer = `"${qa.answer.replace(/"/g, '""')}"`;
      content += `${question},${answer}\n`;
    });

    return content;
  }

  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  static export(qaPairs: QAPair[], options: ExportOptions = { format: 'json' }): void {
    const timestamp = new Date().toISOString().split('T')[0];
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case 'json':
        content = this.exportToJSON(qaPairs, options);
        filename = `interview-qa-pairs-${timestamp}.json`;
        mimeType = 'application/json';
        break;
      case 'txt':
        content = this.exportToTXT(qaPairs, options);
        filename = `interview-qa-pairs-${timestamp}.txt`;
        mimeType = 'text/plain';
        break;
      case 'csv':
        content = this.exportToCSV(qaPairs, options);
        filename = `interview-qa-pairs-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    this.downloadFile(content, filename, mimeType);
  }

  static copyToClipboard(qaPairs: QAPair[], format: 'json' | 'txt' = 'json'): Promise<void> {
    let content: string;
    
    if (format === 'json') {
      content = this.exportToJSON(qaPairs);
    } else {
      content = this.exportToTXT(qaPairs);
    }

    return navigator.clipboard.writeText(content);
  }
}
