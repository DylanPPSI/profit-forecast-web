import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Search, Filter, Edit, Trash2, RefreshCw, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { useSheet } from "@/context/SheetContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MetricsCards from "@/components/MetricsCards";
import { supabase } from "./GoogleSheetsConnector"; // or wherever you export supabase

interface JobData {
  id: string;
  name: string;
  client: string;
  yearlyTotal: number;
  completedToDate: number;
  projectedRemaining: number;
  status: string;
  progress: number;
  projections: { [key: string]: number }; // e.g. { "2025-03": 12345 }
}

interface JobsOverviewProps {
  isConnected: boolean;
  sheetsConfiguration: any;
  profitabilityPercentage: number;
  onMetricsChange?: (metrics: {
    totalJobValue: number;
    completedWork: number;
    remainingWork: number;
    projectedProfit: number;
  }) => void;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const selectCategories = [
  { label: "Pending Bids", folder: "Bid/Pending" },
  { label: "WIP", folder: "WIP/Backlog" },
  { label: "Submitted Bids", folder: "Bid/Submitted" },
];

const JobsOverview = ({
  isConnected,
  sheetsConfiguration,
  profitabilityPercentage,
  onMetricsChange,
}: JobsOverviewProps) => {
  const { sheetConfig, setSheetConfig } = useSheet();

  useEffect(() => {
    // If no file is set in context, try to restore from localStorage
    if (!sheetConfig?.file || !sheetConfig?.path) {
      const lastFile = localStorage.getItem("activeSheetFile");
      const lastCategory = localStorage.getItem("activeSheetCategory");
      // Use your selectCategories array to get the folder
      const lastPath = selectCategories.find(c => c.label === lastCategory)?.folder || "";
      if (lastFile && lastPath) {
        setSheetConfig({ file: lastFile, category: lastCategory, path: lastPath });
      }
    }
  }, [sheetConfig, setSheetConfig]);

  // Log the active sheet config for debugging
  console.log("JobsOverview received sheetConfig:", sheetConfig);
  console.log("Using sheetConfig:", sheetConfig);

  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastExtractedFile, setLastExtractedFile] = useState<string | null>(null);

  // Filter states for the filter card
  const [pendingMonth, setPendingMonth] = useState<string>("any");
  const [pendingYear, setPendingYear] = useState<string>("any");
  const [pendingStatus, setPendingStatus] = useState<string>("any");

  // Search and advanced filter states for the search/filter bar under Job Details
  const [searchTerm, setSearchTerm] = useState("");
  const [sliderRemaining, setSliderRemaining] = useState<number>(0);
  const [sliderCompleted, setSliderCompleted] = useState<number>(0);

  // Applied filter states
  const [filterMonth, setFilterMonth] = useState<string>("any");
  const [filterYear, setFilterYear] = useState<string>("any");
  const [filterStatus, setFilterStatus] = useState<string>("any");

  const [monthProjCols, setMonthProjCols] = useState<
    { idx: number; month: number; year: number; label: string }[]
  >([]);

  const normalizeHeader = (header: string) =>
    header.replace(/\s+/g, " ").replace(/[\r\n]+/g, "").trim().toLowerCase();

  // Extraction function
  const extractJobDataFromWorkbook = (workbook: any) => {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let headerRowIdx = 2;
    while (headerRowIdx < rows.length && rows[headerRowIdx].length < 2) headerRowIdx++;
    const headerRow = rows[headerRowIdx];

    // Map normalized header names to column indices
    const headerDict: Record<string, number> = {};
    headerRow.forEach((header, idx) => {
      if (header && typeof header === "string") {
        headerDict[normalizeHeader(header)] = idx;
      }
    });

    // Find all columns that contain a month and year
    const monthSet = new Set(months);
    const monthCols: { idx: number; month: number; year: number; label: string }[] = [];
    headerRow.forEach((header, idx) => {
      if (typeof header !== "string") return;
      const normalized = header.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
      for (const monthName of monthSet) {
        if (normalized.toLowerCase().includes(monthName.toLowerCase())) {
          const yearMatch = normalized.match(/(\d{4})/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1], 10);
            const month = dayjs(monthName + " 1, " + year).month() + 1; // 1-based
            monthCols.push({ idx, month, year, label: header });
          }
          break;
        }
      }
    });
    setMonthProjCols(monthCols);

    // Find current month/year
    const now = dayjs();
    const currentMonth = now.month() + 1; // 1-based
    const currentYear = now.year();

    // For each job row, extract info
    const jobs: JobData[] = [];
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;

      const projectNum = row[headerDict[normalizeHeader("Project #")]] || "";
      const projectName = row[headerDict[normalizeHeader("Project Name")]] || "";

      let completedToDate = 0;
      let projectedRemaining = 0;
      let yearlyTotal = 0;
      const projections: { [key: string]: number } = {};

      monthCols.forEach(col => {
        const val = parseFloat((row[col.idx] || "0").toString().replace(/[^0-9.-]+/g, "")) || 0;
        yearlyTotal += val;
        const key = `${col.year}-${String(col.month).padStart(2, "0")}`;
        projections[key] = val;
        if (
          col.year < currentYear ||
          (col.year === currentYear && col.month <= currentMonth)
        ) {
          completedToDate += val;
        } else {
          projectedRemaining += val;
        }
      });

      if (!projectNum && !projectName) continue;

      jobs.push({
        id: projectNum.toString(),
        name: projectName.toString(),
        client: "",
        yearlyTotal,
        completedToDate,
        projectedRemaining,
        status: completedToDate >= yearlyTotal ? "Completed" : "In Progress",
        progress: yearlyTotal > 0 ? Math.round((completedToDate / yearlyTotal) * 100) : 0,
        projections,
      });
    }

    setJobs(jobs);
    setIsLoading(false);
  };

  // Refresh/extract handler
  const extractJobDataFromSheets = async () => {
    if (!sheetConfig) return;
    setIsLoading(true);

    let workbook;
    if (sheetConfig.workbook) {
      workbook = sheetConfig.workbook;
    } else if (sheetConfig.filePath) {
      workbook = XLSX.readFile(sheetConfig.filePath);
    } else {
      setIsLoading(false);
      return;
    }
    extractJobDataFromWorkbook(workbook);
  };

  useEffect(() => {
    if (sheetConfig && sheetConfig.workbook) {
      extractJobDataFromWorkbook(sheetConfig.workbook);
    }
  }, [sheetConfig]);

  // Extract unique years from monthProjCols for year selector
  const uniqueYears = Array.from(
    new Set(monthProjCols.map(col => col.year))
  ).sort();

  // Only filter when GO is pressed
  const handleApplyFilter = () => {
    setFilterMonth(pendingMonth);
    setFilterYear(pendingYear);
    setFilterStatus(pendingStatus);
  };

  // Filtering logic for jobs table and chart
  const isAny = (val: string) => val === "any" || !val;

  const filteredJobs = jobs.filter(job => {
    // Search filter (from search bar under Job Details)
    const matchesSearch =
      !searchTerm ||
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter (from filter card)
    const matchesStatus = isAny(filterStatus) ? true : job.status === filterStatus;

    // Month/year filter (from filter card)
    let matchesMonthYear = true;
    if (!isAny(filterMonth) && !isAny(filterYear)) {
      const key = `${filterYear}-${filterMonth}`;
      matchesMonthYear = job.projections[key] > 0;
    } else if (!isAny(filterMonth) && isAny(filterYear)) {
      matchesMonthYear = Object.keys(job.projections).some(k => k.endsWith(`-${filterMonth}`) && job.projections[k] > 0);
    } else if (isAny(filterMonth) && !isAny(filterYear)) {
      matchesMonthYear = Object.keys(job.projections).some(k => k.startsWith(`${filterYear}-`) && job.projections[k] > 0);
    }

    // Sliders (from search/filter bar under Job Details)
    let matchesRemaining = true;
    let matchesCompleted = true;
    if (job.status === "In Progress" && sliderRemaining > 0) {
      matchesRemaining = job.projectedRemaining >= sliderRemaining;
    }
    if (job.status === "Completed" && sliderCompleted > 0) {
      matchesCompleted = job.completedToDate >= sliderCompleted;
    }

    return matchesSearch && matchesStatus && matchesMonthYear && matchesRemaining && matchesCompleted;
  });

  // Chart data: always show all jobs currently listed in Job Details
  const chartData = filteredJobs.map(job => ({
    name: job.name, // full name for tooltip
    shortName: job.name.split(' ')[0], // for axis label
    yearly: job.yearlyTotal,
    completed: job.completedToDate,
    remaining: job.projectedRemaining
  }));

  // Dynamic totals based on filtered jobs
  const totalJobValue = filteredJobs.reduce((sum, job) => sum + job.yearlyTotal, 0);
  const completedWork = filteredJobs.reduce((sum, job) => sum + job.completedToDate, 0);
  const remainingWork = filteredJobs.reduce((sum, job) => sum + job.projectedRemaining, 0);
  const projectedProfit = (completedWork * profitabilityPercentage) / 100;

  // Update metrics in parent when filteredJobs or profitabilityPercentage changes
  useEffect(() => {
    if (onMetricsChange) {
      onMetricsChange({
        totalJobValue,
        completedWork,
        remainingWork,
        projectedProfit,
      });
    }
  }, [totalJobValue, completedWork, remainingWork, projectedProfit, onMetricsChange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "On Hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Placeholder for WIP report generation
  const generateWIPReport = () => {
    alert("WIP Report generation not implemented yet.");
  };

  useEffect(() => {
    const fetchAndExtract = async () => {
      if (
        sheetConfig &&
        sheetConfig.file &&
        sheetConfig.path && // <--- this must be present!
        sheetConfig.file !== lastExtractedFile
      ) {
        setIsLoading(true);
        // Clean up slashes just in case
        const cleanPath = sheetConfig.path.replace(/\/$/, "");
        const cleanFile = sheetConfig.file.replace(/^\//, "");
        const filePath = `${cleanPath}/${cleanFile}`;
        console.log("Supabase filePath:", filePath);
        const { data, error } = await supabase.storage.from("xlsx-files").download(filePath);
        if (error || !data) {
          console.error("Supabase download error:", error?.message, "Path:", filePath);
          setIsLoading(false);
          return;
        }
        const arrayBuffer = await data.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        extractJobDataFromWorkbook(workbook);
        setLastExtractedFile(sheetConfig.file);
        setIsLoading(false);
      }
    };
    fetchAndExtract();
  }, [sheetConfig?.file, sheetConfig?.path]);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!sheetConfig && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-amber-800 font-medium">
              Connect to Supabase in the "Supabase" tab to extract live job data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Extraction Info */}
      {sheetConfig && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">
                  Extracting from: {sheetConfig.file}
                </p>
                <p className="text-blue-700 text-sm">
                  Looking for 2025 headers, Q1-Q4 quarters, and monthly data
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={extractJobDataFromSheets}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Extracting...' : 'Refresh Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Jobs By Month */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Jobs By Month</CardTitle>
          <CardDescription>
            Select a month, year, and status to view jobs in progress for that period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <Select value={pendingYear} onValueChange={setPendingYear}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Year</SelectItem>
                {uniqueYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pendingMonth} onValueChange={setPendingMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Month</SelectItem>
                {months.map((month, idx) => (
                  <SelectItem key={month} value={String(idx + 1).padStart(2, "0")}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={pendingStatus} onValueChange={setPendingStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Status</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleApplyFilter}>GO</Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Job Values Overview</CardTitle>
          <CardDescription>
            Yearly totals, completed to date, and projected remaining
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/*}
          <MetricsCards
            totalJobValue={totalJobValue}
            completedWork={completedWork}
            remainingWork={remainingWork}
            projectedProfit={projectedProfit}
            profitabilityPercentage={profitabilityPercentage}
            fixedOverhead={0}
          />
          */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="shortName"
                tickFormatter={(value, index) => chartData[index]?.shortName}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [`$${value.toLocaleString()}`, name]}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const job = chartData.find(j => j.shortName === label);
                    return (
                      <div className="bg-white p-2 rounded shadow text-xs">
                        <div className="font-semibold">{job?.name}</div>
                        {payload.map((entry, idx) => (
                          <div key={idx}>
                            <span style={{ color: entry.color }}>{entry.name}:</span> ${entry.value.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#3b82f6" name="Completed to Date" />
              <Bar dataKey="remaining" fill="#f59e0b" name="Projected Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>
                {sheetConfig ? "Live data from Google Sheets" : "Sample data - connect to see live job information"}
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="mb-4">
                  <div className="font-medium mb-1">In Progress: Remaining ≥ ${sliderRemaining.toLocaleString()}</div>
                  <Slider
                    min={0}
                    max={1000000}
                    step={1000}
                    value={[sliderRemaining]}
                    onValueChange={([val]) => setSliderRemaining(val)}
                  />
                </div>
                <div>
                  <div className="font-medium mb-1">Completed: Completed ≥ ${sliderCompleted.toLocaleString()}</div>
                  <Slider
                    min={0}
                    max={1000000}
                    step={1000}
                    value={[sliderCompleted]}
                    onValueChange={([val]) => setSliderCompleted(val)}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Jobs List */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Extracting job data from Google Sheets...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">{job.name}</h3>
                        <p className="text-sm text-gray-600">{job.client} • {job.id}</p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Yearly Total</p>
                      <p className="font-semibold">${job.yearlyTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completed to Date</p>
                      <p className="font-semibold">${job.completedToDate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Projected Remaining</p>
                      <p className="font-semibold">${job.projectedRemaining.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                </div>
              ))}
              
              {filteredJobs.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? "No jobs match your search" : "No job data available"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsOverview;