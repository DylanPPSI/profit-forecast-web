
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Link, CheckCircle, AlertCircle } from "lucide-react";

interface GoogleSheetsConnectorProps {
  onConnectionChange: (connected: boolean, sheetData?: any) => void;
}

const GoogleSheetsConnector = ({ onConnectionChange }: GoogleSheetsConnectorProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [q1Range, setQ1Range] = useState("");
  const [q2Range, setQ2Range] = useState("");
  const [q3Range, setQ3Range] = useState("");
  const [q4Range, setQ4Range] = useState("");
  const [availableFiles, setAvailableFiles] = useState([
    { id: "1", name: "Job Tracker 2024", url: "https://docs.google.com/spreadsheets/d/example1" },
    { id: "2", name: "Project Database", url: "https://docs.google.com/spreadsheets/d/example2" },
    { id: "3", name: "WIP Data Master", url: "https://docs.google.com/spreadsheets/d/example3" }
  ]);

  const handleGoogleAuth = () => {
    // In a real implementation, this would use Google's OAuth
    console.log("Initiating Google Sheets OAuth...");
    
    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnected(true);
      console.log("Google Sheets connected successfully");
    }, 1500);
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    const file = availableFiles.find(f => f.id === fileId);
    console.log("Selected file:", file?.name);
  };

  const handleSaveConfiguration = () => {
    if (!selectedFile || !q1Range || !q2Range || !q3Range || !q4Range) {
      alert("Please fill in all required fields");
      return;
    }

    const configuration = {
      fileId: selectedFile,
      fileName: availableFiles.find(f => f.id === selectedFile)?.name,
      ranges: {
        Q1: q1Range,
        Q2: q2Range,
        Q3: q3Range,
        Q4: q4Range
      }
    };

    console.log("Saving Google Sheets configuration:", configuration);
    onConnectionChange(true, configuration);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedFile("");
    setQ1Range("");
    setQ2Range("");
    setQ3Range("");
    setQ4Range("");
    onConnectionChange(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5" />
          <span>Google Sheets Integration</span>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect to your Google Sheets to automatically sync job data and generate WIP reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-lg p-6 mb-4">
              <FileSpreadsheet className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">Connect to Google Sheets</h3>
              <p className="text-blue-700 text-sm mb-4">
                Authorize access to your Google Sheets to sync job data automatically
              </p>
              <Button onClick={handleGoogleAuth} className="flex items-center space-x-2">
                <Link className="h-4 w-4" />
                <span>Connect Google Sheets</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              You'll be redirected to Google to authorize access to your spreadsheets
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="file-select">Select Spreadsheet</Label>
              <Select value={selectedFile} onValueChange={handleFileSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a spreadsheet..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map((file) => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Range Configuration */}
            {selectedFile && (
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-amber-600" />
                    Configure Data Ranges
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Specify the cell ranges for each quarter's job data (e.g., "A2:E50")
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="q1-range">Q1 Data Range</Label>
                      <Input
                        id="q1-range"
                        placeholder="e.g., A2:E25"
                        value={q1Range}
                        onChange={(e) => setQ1Range(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="q2-range">Q2 Data Range</Label>
                      <Input
                        id="q2-range"
                        placeholder="e.g., A26:E50"
                        value={q2Range}
                        onChange={(e) => setQ2Range(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="q3-range">Q3 Data Range</Label>
                      <Input
                        id="q3-range"
                        placeholder="e.g., A51:E75"
                        value={q3Range}
                        onChange={(e) => setQ3Range(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="q4-range">Q4 Data Range</Label>
                      <Input
                        id="q4-range"
                        placeholder="e.g., A76:E100"
                        value={q4Range}
                        onChange={(e) => setQ4Range(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Button variant="outline" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                  <Button onClick={handleSaveConfiguration}>
                    Save Configuration
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsConnector;
