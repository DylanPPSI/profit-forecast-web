import { useState, useRef, useEffect } from "react";
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
  CheckCircle,
  AlertCircle,
  Upload,
  Edit,
  Trash2,
  Save,
} from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Supabase credentials (use .env for production!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const GoogleSheetsConnector = () => {
  const { setSheetConfig } = useSheet();
  const [isConnected, setIsConnected] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<{ name: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  // const [q1Range, setQ1Range] = useState("");
  // const [q2Range, setQ2Range] = useState("");
  // const [q3Range, setQ3Range] = useState("");
  // const [q4Range, setQ4Range] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editFileName, setEditFileName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List files on mount
  useEffect(() => {
    const connectAndList = async () => {
      const { data, error } = await supabase.storage.from("xlsx-files").list();
      if (error) {
        console.error("Error listing files:", error.message);
        return;
      }
      if (data) {
        const files = data.filter((item) => item.name && !item.name.endsWith("/"));
        setAvailableFiles(files);
        setIsConnected(true);
        if (files.length > 0) setSelectedFile(files[0].name);
      }
    };
    connectAndList();
  }, []);

  // Upload XLSX file to Supabase
  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) {
      alert("Only .xlsx files are supported.");
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      try {
        const workbook = XLSX.read(data, { type: "array" });
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const { error } = await supabase.storage
          .from("xlsx-files")
          .upload(file.name, new Blob([wbout]), { upsert: true });
        if (error) {
          alert("Failed to upload file to Supabase: " + error.message);
          setIsUploading(false);
          return;
        }
        alert("File uploaded to Supabase!");
        // Refresh file list
        const { data: files } = await supabase.storage.from("xlsx-files").list();
        setAvailableFiles(files || []);
      } catch (err) {
        console.error("XLSX processing error:", err);
        alert("There was a problem processing the Excel file.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Delete file from Supabase
  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    if (!window.confirm(`Delete "${selectedFile}" from Supabase?`)) return;
    const { error } = await supabase.storage.from("xlsx-files").remove([selectedFile]);
    if (error) {
      alert("Failed to delete file: " + error.message);
      return;
    }
    alert("File deleted!");
    // Refresh file list
    const { data: files } = await supabase.storage.from("xlsx-files").list();
    setAvailableFiles(files || []);
    setSelectedFile(files && files.length > 0 ? files[0].name : "");
  };

  // Edit (rename) file in Supabase
  const handleEditFile = async () => {
    if (!selectedFile || !editFileName || editFileName === selectedFile) {
      setIsEditing(false);
      return;
    }
    // Download the file
    const { data, error } = await supabase.storage.from("xlsx-files").download(selectedFile);
    if (error || !data) {
      alert("Failed to download file for renaming.");
      setIsEditing(false);
      return;
    }
    // Upload with new name
    const { error: uploadError } = await supabase.storage
      .from("xlsx-files")
      .upload(editFileName, data, { upsert: true });
    if (uploadError) {
      alert("Failed to upload renamed file: " + uploadError.message);
      setIsEditing(false);
      return;
    }
    // Delete old file
    await supabase.storage.from("xlsx-files").remove([selectedFile]);
    alert("File renamed!");
    // Refresh file list
    const { data: files } = await supabase.storage.from("xlsx-files").list();
    setAvailableFiles(files || []);
    setSelectedFile(editFileName);
    setIsEditing(false);
  };

  // Save config to Supabase table (optional)
  const handleSaveConfigToTable = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    // Example: Save config to a table called "file_configs"
    const { error } = await supabase.from("file_configs").upsert([
      {
        file: selectedFile,
        // q1: q1Range,
        // q2: q2Range,
        // q3: q3Range,
        // q4: q4Range,
        updated_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      alert("Failed to save config to Supabase table: " + error.message);
      return;
    }
    alert("File selection saved to Supabase table!");
  };

  // Save config locally
  const handleSave = () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    setSheetConfig({
      file: selectedFile,
      // ranges: {
      //   Q1: q1Range,
      //   Q2: q2Range,
      //   Q3: q3Range,
      //   Q4: q4Range,
      // },
    });
    alert("File selection saved locally!");
  };

  useEffect(() => {
    const savedFile = localStorage.getItem("activeSheetFile");
    if (savedFile) setSelectedFile(savedFile);
  }, []);

  useEffect(() => {
    if (selectedFile) {
      setSheetConfig({ file: selectedFile });
      localStorage.setItem("activeSheetFile", selectedFile);
      console.log("Active sheet set in context:", selectedFile);
    }
  }, [selectedFile, setSheetConfig]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5" />
          <span>Excel/Supabase Integration</span>
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Files in Supabase are automatically listed below.
          <br />
          <span className="font-medium">Or upload a new Excel file:</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload section */}
        <div className="space-y-2">
          <Label htmlFor="xlsx-upload">Upload Excel File</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4" />
              <span>{isUploading ? "Uploading..." : "Upload Excel (.xlsx)"}</span>
            </Button>
            <Input
              ref={fileInputRef}
              id="xlsx-upload"
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleXlsxUpload}
              disabled={isUploading}
            />
          </div>
          <span className="text-xs text-gray-500">
            Choose an Excel file to upload to Supabase.
          </span>
        </div>

        {/* File selection */}
        {availableFiles.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="file-select">Select Supabase File</Label>
            <div className="flex gap-2 items-center">
              <Select value={selectedFile} onValueChange={setSelectedFile}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a file from Supabase..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFiles.map((file) => (
                    <SelectItem key={file.name} value={file.name}>
                      {file.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditFileName(selectedFile);
                  setIsEditing(true);
                }}
                disabled={!selectedFile}
                title="Edit file name"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteFile}
                disabled={!selectedFile}
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {isEditing && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={editFileName}
                  onChange={e => setEditFileName(e.target.value)}
                  placeholder="New file name"
                />
                <Button size="sm" onClick={handleEditFile}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            No files found in Supabase storage.
          </div>
        )}

        {/* Range configuration - commented out */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Q1 Range</Label>
            <Input
              value={q1Range}
              onChange={(e) => setQ1Range(e.target.value)}
              placeholder="e.g. A2:C10"
            />
          </div>
          <div>
            <Label>Q2 Range</Label>
            <Input
              value={q2Range}
              onChange={(e) => setQ2Range(e.target.value)}
              placeholder="e.g. D2:F10"
            />
          </div>
          <div>
            <Label>Q3 Range</Label>
            <Input
              value={q3Range}
              onChange={(e) => setQ3Range(e.target.value)}
              placeholder="e.g. G2:I10"
            />
          </div>
          <div>
            <Label>Q4 Range</Label>
            <Input
              value={q4Range}
              onChange={(e) => setQ4Range(e.target.value)}
              placeholder="e.g. J2:L10"
            />
          </div>
        </div> */}

        {/* Save configuration */}
        <div className="pt-4 flex gap-2">
          <Button onClick={handleSave}>Set Active File (Local)</Button>
          {/* <Button variant="outline" onClick={handleSaveConfigToTable}>
            Save File Selection to Supabase Table
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsConnector;