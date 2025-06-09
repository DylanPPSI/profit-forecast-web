
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Upload, Trash2 } from "lucide-react";

interface EmailData {
  id: string;
  date?: string;
  jobNumber?: string;
  jobName?: string;
  totalValue?: string;
  completedWork?: string;
  remainingWork?: string;
  [key: string]: string | undefined;
}

const EmailDataExtractor = () => {
  const [emailText, setEmailText] = useState("");
  const [extractedData, setExtractedData] = useState<EmailData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseEmailData = () => {
    setIsProcessing(true);
    
    // Split by common email separators (this can be customized based on your email format)
    const emails = emailText.split(/\n\s*\n|------|======|From:|Subject:/).filter(section => section.trim());
    
    const parsedData: EmailData[] = [];
    
    emails.forEach((email, index) => {
      const lines = email.split('\n').map(line => line.trim()).filter(line => line);
      
      // Extract data based on common patterns (customize these patterns based on your email format)
      const dataRow: EmailData = {
        id: `email-${index + 1}`,
      };
      
      lines.forEach(line => {
        // Look for date patterns
        const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        if (dateMatch && !dataRow.date) {
          dataRow.date = dateMatch[1];
        }
        
        // Look for job numbers (customize pattern as needed)
        const jobNumberMatch = line.match(/job\s*#?\s*(\w+)|project\s*#?\s*(\w+)/i);
        if (jobNumberMatch && !dataRow.jobNumber) {
          dataRow.jobNumber = jobNumberMatch[1] || jobNumberMatch[2];
        }
        
        // Look for job names
        const jobNameMatch = line.match(/job\s*name\s*:?\s*(.+)|project\s*name\s*:?\s*(.+)/i);
        if (jobNameMatch && !dataRow.jobName) {
          dataRow.jobName = (jobNameMatch[1] || jobNameMatch[2]).replace(/['"]/g, '');
        }
        
        // Look for monetary values
        const dollarAmounts = line.match(/\$[\d,]+\.?\d*/g);
        if (dollarAmounts) {
          if (line.match(/total|contract|value/i) && !dataRow.totalValue) {
            dataRow.totalValue = dollarAmounts[0];
          } else if (line.match(/completed|done|finished/i) && !dataRow.completedWork) {
            dataRow.completedWork = dollarAmounts[0];
          } else if (line.match(/remaining|left|outstanding/i) && !dataRow.remainingWork) {
            dataRow.remainingWork = dollarAmounts[0];
          }
        }
      });
      
      // Only add if we found some meaningful data
      if (dataRow.date || dataRow.jobNumber || dataRow.jobName || Object.keys(dataRow).length > 1) {
        parsedData.push(dataRow);
      }
    });
    
    setExtractedData(parsedData);
    setIsProcessing(false);
  };

  const clearData = () => {
    setEmailText("");
    setExtractedData([]);
  };

  const exportToCSV = () => {
    if (extractedData.length === 0) return;
    
    const headers = Object.keys(extractedData[0]).filter(key => key !== 'id');
    const csvContent = [
      headers.join(','),
      ...extractedData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_email_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Email Data Extractor</span>
          </CardTitle>
          <CardDescription>
            Paste your email content below to extract job data into table format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your email content here... The system will try to extract job numbers, dates, dollar amounts, and job names automatically."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="flex space-x-2">
            <Button 
              onClick={parseEmailData}
              disabled={!emailText.trim() || isProcessing}
            >
              {isProcessing ? "Processing..." : "Extract Data"}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearData}
              disabled={!emailText && extractedData.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {extractedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Extracted Data</CardTitle>
                <CardDescription>
                  Found {extractedData.length} records
                </CardDescription>
              </div>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Job Number</TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Completed Work</TableHead>
                  <TableHead>Remaining Work</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date || '-'}</TableCell>
                    <TableCell>{row.jobNumber || '-'}</TableCell>
                    <TableCell>{row.jobName || '-'}</TableCell>
                    <TableCell>{row.totalValue || '-'}</TableCell>
                    <TableCell>{row.completedWork || '-'}</TableCell>
                    <TableCell>{row.remainingWork || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailDataExtractor;
