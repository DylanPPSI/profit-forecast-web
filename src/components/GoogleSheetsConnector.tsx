import { useState, useRef, useEffect } from "react";
import { useSheet } from "@/context/SheetContext";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet, CheckCircle, AlertCircle, Upload, Edit, Trash2, Save,
} from "lucide-react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

// Supabase credentials (use .env for production!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const uploadFolders = {
  "Pending Bids": "Bid/Pending",
  "Submitted Bids": "Bid/Submitted",
  "WIP": "WIP/Backlog",
};

const selectCategories = [
  { label: "Pending Bids", folder: "Bid/Pending" },
  { label: "WIP", folder: "WIP/Backlog" },
];

const GoogleSheetsConnector = () => {
  const { setSheetConfig } = useSheet();
  const [isConnected, setIsConnected] = useState(false);

  // For upload
  const [fileType, setFileType] = useState('');
  const [fileTypeError, setFileTypeError] = useState(false);

  // For selecting active file
  const [activeCategory, setActiveCategory] = useState(selectCategories[0].label);
  const [availableFiles, setAvailableFiles] = useState<{ name: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [editFileName, setEditFileName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List files for the selected category
  useEffect(() => {
    const listFiles = async () => {
      const folder = selectCategories.find(c => c.label === activeCategory)?.folder || "";
      const { data, error } = await supabase.storage.from("xlsx-files").list(folder);
      if (error) {
        console.error("Error listing files:", error.message);
        setAvailableFiles([]);
        return;
      }
      if (data) {
        const files = data.filter((item) => item.name && !item.name.endsWith("/"));
        setAvailableFiles(files);
        setIsConnected(true);
        if (files.length > 0) setSelectedFile(files[0].name);
        else setSelectedFile("");
      }
    };
    listFiles();
  }, [activeCategory]);

  // Upload XLSX file to Supabase
  const handleXlsxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!fileType) {
      setFileTypeError(true);
      alert("Please select a file type before uploading.");
      return;
    }
    setFileTypeError(false);
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
        const folder = uploadFolders[fileType];
        const uploadPath = `${folder}/${file.name}`;
        const { error } = await supabase.storage
          .from("xlsx-files")
          .upload(uploadPath, new Blob([wbout]), { upsert: true });
        if (error) {
          alert("Failed to upload file to Supabase: " + error.message);
          setIsUploading(false);
          return;
        }
        alert("File uploaded to Supabase!");
        // Refresh file list if in the same category
        if (activeCategory && uploadFolders[fileType] === selectCategories.find(c => c.label === activeCategory)?.folder) {
          const { data: files } = await supabase.storage.from("xlsx-files").list(folder);
          setAvailableFiles((files || []).filter((item) => item.name && !item.name.endsWith("/")));
        }
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
    const folder = selectCategories.find(c => c.label === activeCategory)?.folder || "";
    const filePath = `${folder}/${selectedFile}`;
    if (!window.confirm(`Delete "${selectedFile}" from Supabase?`)) return;
    const { error } = await supabase.storage.from("xlsx-files").remove([filePath]);
    if (error) {
      alert("Failed to delete file: " + error.message);
      return;
    }
    alert("File deleted!");
    // Refresh file list
    const { data: files } = await supabase.storage.from("xlsx-files").list(folder);
    setAvailableFiles((files || []).filter((item) => item.name && !item.name.endsWith("/")));
    setSelectedFile(files && files.length > 0 ? files[0].name : "");
  };

  // Edit (rename) file in Supabase
  const handleEditFile = async () => {
    if (!selectedFile || !editFileName || editFileName === selectedFile) {
      setIsEditing(false);
      return;
    }
    const folder = selectCategories.find(c => c.label === activeCategory)?.folder || "";
    const oldPath = `${folder}/${selectedFile}`;
    const newPath = `${folder}/${editFileName}`;
    // Download the file
    const { data, error } = await supabase.storage.from("xlsx-files").download(oldPath);
    if (error || !data) {
      alert("Failed to download file for renaming.");
      setIsEditing(false);
      return;
    }
    // Upload with new name
    const { error: uploadError } = await supabase.storage
      .from("xlsx-files")
      .upload(newPath, data, { upsert: true });
    if (uploadError) {
      alert("Failed to upload renamed file: " + uploadError.message);
      setIsEditing(false);
      return;
    }
    // Delete old file
    await supabase.storage.from("xlsx-files").remove([oldPath]);
    alert("File renamed!");
    // Refresh file list
    const { data: files } = await supabase.storage.from("xlsx-files").list(folder);
    setAvailableFiles((files || []).filter((item) => item.name && !item.name.endsWith("/")));
    setSelectedFile(editFileName);
    setIsEditing(false);
  };

  // Save config locally
  const handleSave = () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    setSheetConfig({
      file: selectedFile,
      category: activeCategory,
      path: selectCategories.find(c => c.label === activeCategory)?.folder || "",
    });
    alert("File selection saved locally!");
  };

  // Restore last used file/category
  useEffect(() => {
    const savedCategory = localStorage.getItem("activeSheetCategory");
    const savedFile = localStorage.getItem("activeSheetFile");
    if (savedCategory && selectCategories.some(c => c.label === savedCategory)) {
      setActiveCategory(savedCategory);
    }
    if (savedFile) setSelectedFile(savedFile);
  }, []);

  // Persist selection and update context
  useEffect(() => {
    if (selectedFile) {
      setSheetConfig({
        file: selectedFile,
        category: activeCategory,
        path: selectCategories.find(c => c.label === activeCategory)?.folder || "",
      });
      localStorage.setItem("activeSheetFile", selectedFile);
      localStorage.setItem("activeSheetCategory", activeCategory);
      console.log("Active sheet set in context:", selectedFile, "Category:", activeCategory);
    }
  }, [selectedFile, activeCategory, setSheetConfig]);

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
            <div className="flex gap-2 items-center">
              <Select
                value={fileType}
                onValueChange={(val) => {
                  setFileType(val);
                  setFileTypeError(false);
                }}
              >
                <SelectTrigger
                  style={fileTypeError ? { borderColor: 'red', borderWidth: 2 } : {}}
                >
                  <SelectValue placeholder="Select an Option" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(uploadFolders).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fileTypeError && (
                <span className="text-red-600 text-xs ml-2">File type is required</span>
              )}
            </div>
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
        <div className="space-y-2">
          <Label htmlFor="category-select">Select File Category</Label>
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category..." />
            </SelectTrigger>
            <SelectContent>
              {selectCategories.map((cat) => (
                <SelectItem key={cat.label} value={cat.label}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

        {/* Save configuration */}
        <div className="pt-4 flex gap-2">
          <Button onClick={handleSave}>
            {activeCategory === "WIP"
              ? "Set Active File - Jobs"
              : activeCategory === "Pending Bids"
              ? "Set Active File Bids"
              : "Set Active File"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsConnector;