import { useState, useRef } from "react";
import { useSheet } from "@/context/SheetContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Link,
  CheckCircle,
  AlertCircle,
  Upload,
} from "lucide-react";

// Add XLSX import for parsing Excel files
import * as XLSX from "xlsx";
// import { createClient } from "@supabase/supabase-js";

// // Initialize Supabase client (replace with your actual keys)
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pqpjfelenpzqtgkorbpb.supabase.co",
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcGpmZWxlbnB6cXRna29yYnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Nzk4MjcsImV4cCI6MjA2NTI1NTgyN30.f4hxU0nWJfAIBVxb7cn4l6xqr6iECgtU2hQeRNxgPYw"
// );

// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pqpjfelenpzqtgkorbpb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxcGpmZWxlbnB6cXRna29yYnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Nzk4MjcsImV4cCI6MjA2NTI1NTgyN30.f4hxU0nWJfAIBVxb7cn4l6xqr6iECgtU2hQeRNxgPYw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


interface GoogleSheetsConnectorProps {
  onConnectionChange: (connected: boolean, sheetData?: any) => void;
}

const GoogleSheetsConnector = () => {
  const { sheetConfig, setSheetConfig } = useSheet();
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [q1Range, setQ1Range] = useState("");
  const [q2Range, setQ2Range] = useState("");
  const [q3Range, setQ3Range] = useState("");
  const [q4Range, setQ4Range] = useState("");
  const [availableFiles, setAvailableFiles] = useState([
    { id: "1", name: "Job Tracker 2024", url: "https://docs.google.com/spreadsheets/d/example1" },
    { id: "2", name: "Project Database", url: "https://docs.google.com/spreadsheets/d/example2" },
    { id: "3", name: "WIP Data Master", url: "https://docs.google.com/spreadsheets/d/example3" },
  ]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);
  const [renamedFile, setRenamedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      const popup = window.open(
        "https://your-backend.com/auth/google", // Your backend auth route
        "google-oauth",
        "width=500,height=600"
      );

      const pollTimer = window.setInterval(() => {
        if (!popup || popup.closed) {
          window.clearInterval(pollTimer);
          return;
        }

        try {
          const url = new URL(popup.location.href);
          if (url.pathname === "/auth/success") {
            window.clearInterval(pollTimer);
            popup.close();
            setIsConnected(true);
            onConnectionChange(true);
            console.log("Google OAuth completed successfully");
          }
        } catch (e) {
          // Ignore cross-origin errors while waiting
        }
      }, 500);
    } catch (err) {
      console.error("OAuth failed:", err);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFile(fileId);
    setUploadedFileName(null);
    setUploadedFileData(null);
    const file = availableFiles.find(f => f.id === fileId);
    console.log("Selected file:", file?.name);
  };

  // Save XLSX file to Supabase Storage and send data to jobs overview
  const saveXlsxToSupabase = async (file: File, workbook: any, newName?: string) => {
    setIsUploading(true);
    try {
      // Convert workbook to binary blob
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const fileName = newName || file.name;
      // Upload to Supabase Storage (bucket: "xlsx-files")
      const { data, error } = await supabase.storage
        .from("xlsx-files")
        .upload(fileName, new Blob([wbout]), { upsert: true });

      if (error) {
        alert("Failed to upload file to Supabase: " + error.message);
        setIsUploading(false);
        return;
      }

      // Optionally, insert a record in a table for tracking
      await supabase.from("uploaded_files").insert([
        { file_name: fileName, original_name: file.name }
      ]);

      // Send data to jobs overview (call a callback or use context)
      onConnectionChange(true, {
        type: "xlsx",
        workbook,
        fileName,
        supabasePath: data?.path,
      });
    } catch (err) {
      alert("Error uploading file: " + (err as Error).message);
    }
    setIsUploading(false);
  };

  // Modified XLSX upload handler
  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setRenamedFile(file.name);
    setSelectedFile("");
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "binary" });
      setUploadedFileData(workbook); // <-- Make sure this is here!
      setSheetConfig({
        type: "xlsx",
        workbook: uploadedFileData, // <-- this must be the parsed XLSX workbook object
        fileName: uploadedFileName,
        ranges: { Q1: q1Range, Q2: q2Range, Q3: q3Range, Q4: q4Range }
      });
      setIsConnected(true);
    };
    reader.readAsBinaryString(file);
  };

  // Handler for renaming the file and saving to Supabase
  const handleRenameAndSave = async () => {
    if (!uploadedFileData || !uploadedFileName || !renamedFile) return;
    // Create a dummy File object for upload (browser limitation workaround)
    const wbout = XLSX.write(uploadedFileData, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const file = new File([blob], { name: renamedFile, type: blob.type });
    await saveXlsxToSupabase(file, uploadedFileData, renamedFile);
    setUploadedFileName(renamedFile);
    setUploadedFileData(uploadedFileData); // <-- Keep this!
  };

  const handleSaveConfiguration = () => {
    console.log({
      selectedFile,
      uploadedFileData,
      q1Range,
      q2Range,
      q3Range,
      q4Range
    });
    if ((!selectedFile && !uploadedFileData) || !q1Range || !q2Range || !q3Range || !q4Range) {
      alert("Please fill in all required fields");
      return;
    }

    const configuration = {
      fileId: selectedFile,
      fileName: selectedFile
        ? availableFiles.find(f => f.id === selectedFile)?.name
        : uploadedFileName,
      ranges: {
        Q1: q1Range,
        Q2: q2Range,
        Q3: q3Range,
        Q4: q4Range,
      },
      type: selectedFile ? "google" : "xlsx",
      workbook: uploadedFileData,
    };

    console.log("Saving configuration:", configuration);
    setSheetConfig(configuration);;
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setSelectedFile("");
    setQ1Range("");
    setQ2Range("");
    setQ3Range("");
    setQ4Range("");
    setUploadedFileName(null);
    setUploadedFileData(null);
    setSheetConfig(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5" />
          <span>Google Sheets or Excel Integration</span>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect to your Google Sheets or upload an Excel file to sync job data and generate WIP reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center py-8">
            <div
              className={`bg-blue-50 rounded-lg p-6 mb-4 transition-all duration-200 border-2 ${dragActive ? "border-blue-400" : "border-transparent"}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
              onDrop={e => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.name.endsWith(".xlsx")) {
                    const event = {
                      target: { files: [file] }
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleXlsxUpload(event);
                  } else {
                    alert("Please upload a valid .xlsx file.");
                  }
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: "pointer" }}
            >
              <FileSpreadsheet className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">Connect to Google Sheets</h3>
              <p className="text-blue-700 text-sm mb-4">
                Authorize access to your Google Sheets to sync job data automatically
              </p>
              <Button onClick={handleGoogleAuth} className="flex items-center space-x-2 mb-2">
                <Link className="h-4 w-4" />
                <span>Connect Google Sheets</span>
              </Button>
              <div className="my-4 flex items-center justify-center">
                <span className="text-gray-400 text-xs mx-2">OR</span>
              </div>
              <Label htmlFor="xlsx-upload" className="flex flex-col items-center cursor-pointer">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload or Drag & Drop Excel (.xlsx)</span>
                </Button>
                <Input
                  ref={fileInputRef}
                  id="xlsx-upload"
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleXlsxUpload}
                />
                <span className="text-xs text-gray-500 mt-2">
                  Drag and drop your .xlsx file here, or click to select.
                </span>
              </Label>
              {uploadedFileName && (
                <div className="mt-2 text-green-700 text-sm">
                  Uploaded: {uploadedFileName}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              You'll be redirected to Google to authorize access to your spreadsheets, or upload an Excel file instead.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Selection */}
            {!uploadedFileName && (
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
            )}
            {uploadedFileName && (
              <div className="space-y-2">
                <Label>Uploaded Excel File</Label>
                <div className="p-2 bg-green-50 rounded text-green-700 text-sm flex items-center gap-2">
                  <Input
                    className="w-auto flex-1"
                    value={renamedFile ?? uploadedFileName}
                    onChange={e => setRenamedFile(e.target.value)}
                    disabled={isUploading}
                  />
                  <Button
                    size="sm"
                    onClick={handleRenameAndSave}
                    disabled={isUploading || !renamedFile || renamedFile === uploadedFileName}
                  >
                    {isUploading ? "Saving..." : "Rename & Save"}
                  </Button>
                </div>
              </div>
            )}

            {/* Range Configuration */}
            {(selectedFile || uploadedFileName) && (
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