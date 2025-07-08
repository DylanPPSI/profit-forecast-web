
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useSheet } from "@/context/SheetContext";

interface ProgressData {
  jobName: string;
  totalValue: number;
  completedWork: number;
  remainingWork: number;
  percentComplete: number;
  status: string;
  lastUpdated: string;
}

const ProgressTracker = () => {
  const { sheetConfig } = useSheet();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate fetching data from Google Sheets
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in reality this would come from the sheet
      const mockData: ProgressData[] = [
        {
          jobName: "Commercial Building Renovation",
          totalValue: 250000,
          completedWork: 175000,
          remainingWork: 75000,
          percentComplete: 70,
          status: "On Track",
          lastUpdated: "2025-01-15"
        },
        {
          jobName: "Residential Complex Phase 2",
          totalValue: 180000,
          completedWork: 108000,
          remainingWork: 72000,
          percentComplete: 60,
          status: "Behind Schedule",
          lastUpdated: "2025-01-14"
        },
        {
          jobName: "Office Space Upgrade",
          totalValue: 95000,
          completedWork: 85500,
          remainingWork: 9500,
          percentComplete: 90,
          status: "Ahead of Schedule",
          lastUpdated: "2025-01-16"
        },
        {
          jobName: "Warehouse Expansion",
          totalValue: 320000,
          completedWork: 96000,
          remainingWork: 224000,
          percentComplete: 30,
          status: "On Track",
          lastUpdated: "2025-01-13"
        }
      ];
      
      setProgressData(mockData);
    } catch (err) {
      setError("Failed to fetch progress data from Google Sheets");
      console.error("Error fetching progress data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sheetConfig?.spreadsheetId) {
      fetchProgressData();
    }
  }, [sheetConfig]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Ahead of Schedule":
        return "default";
      case "On Track":
        return "secondary";
      case "Behind Schedule":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

//   if (!sheetConfig?.spreadsheetId) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center space-x-2">
//             <AlertCircle className="h-5 w-5 text-amber-600" />
//             <span>Google Sheets Not Connected</span>
//           </CardTitle>
//           <CardDescription>
//             Please connect to Google Sheets in the "Google Sheets" tab to view progress tracking data.
//           </CardDescription>
//         </CardHeader>
//       </Card>
//     );
//   }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Progress Tracker</span>
              </CardTitle>
              <CardDescription>
                Real-time job progress data from your Google Sheets
              </CardDescription>
            </div>
            <Button 
              onClick={fetchProgressData}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading progress data...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-center">Progress</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressData.map((job, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{job.jobName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(job.totalValue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(job.completedWork)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(job.remainingWork)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${job.percentComplete}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium min-w-[3rem]">
                            {job.percentComplete}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {new Date(job.lastUpdated).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;
