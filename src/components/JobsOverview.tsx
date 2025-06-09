
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Search, Filter, Edit, Trash2, RefreshCw } from "lucide-react";

interface JobsOverviewProps {
  isConnected: boolean;
  sheetsConfiguration?: any;
}

interface JobData {
  id: string;
  name: string;
  client: string;
  yearlyTotal: number;
  completedToDate: number;
  projectedRemaining: number;
  status: string;
  progress: number;
}

const JobsOverview = ({ isConnected, sheetsConfiguration }: JobsOverviewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data extraction function - would connect to actual Google Sheets API
  const extractJobDataFromSheets = async () => {
    if (!sheetsConfiguration) return;
    
    setIsLoading(true);
    console.log("Extracting job data from sheets configuration:", sheetsConfiguration);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock extracted data based on your specifications
    const extractedJobs: JobData[] = [
      {
        id: "JOB-001",
        name: "Downtown Office Complex",
        client: "Metro Corp",
        yearlyTotal: 125000,
        completedToDate: 87500,
        projectedRemaining: 37500,
        status: "In Progress",
        progress: 70
      },
      {
        id: "JOB-002", 
        name: "Retail Shopping Center",
        client: "Retail Plus",
        yearlyTotal: 98000,
        completedToDate: 98000,
        projectedRemaining: 0,
        status: "Completed",
        progress: 100
      },
      {
        id: "JOB-003",
        name: "Warehouse Facility", 
        client: "Logistics Inc",
        yearlyTotal: 156750,
        completedToDate: 62700,
        projectedRemaining: 94050,
        status: "In Progress",
        progress: 40
      },
      {
        id: "JOB-004",
        name: "Residential Complex",
        client: "Home Builders", 
        yearlyTotal: 107000,
        completedToDate: 64200,
        projectedRemaining: 42800,
        status: "In Progress",
        progress: 60
      }
    ];
    
    setJobs(extractedJobs);
    setIsLoading(false);
    console.log("Extracted job data:", extractedJobs);
  };

  // Extract data when configuration changes
  useEffect(() => {
    if (isConnected && sheetsConfiguration) {
      extractJobDataFromSheets();
    }
  }, [isConnected, sheetsConfiguration]);

  const chartData = jobs.map(job => ({
    name: job.name.split(' ')[0],
    yearly: job.yearlyTotal,
    completed: job.completedToDate,
    remaining: job.projectedRemaining
  }));

  const filteredJobs = jobs.filter(job =>
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-amber-800 font-medium">
              Connect to Google Sheets in the "Google Sheets" tab to extract live job data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Extraction Info */}
      {isConnected && sheetsConfiguration && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800 font-medium">
                  Extracting from: {sheetsConfiguration.fileName}
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

      {/* Jobs Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Job Values Overview</CardTitle>
          <CardDescription>Yearly totals, completed to date, and projected remaining</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
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
                {isConnected ? "Live data from Google Sheets" : "Sample data - connect to see live job information"}
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
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
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
