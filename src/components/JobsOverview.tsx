
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";

interface JobsOverviewProps {
  isConnected: boolean;
}

const JobsOverview = ({ isConnected }: JobsOverviewProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock job data - would come from Google Sheets
  const jobs = [
    {
      id: "JOB-001",
      name: "Downtown Office Complex",
      client: "Metro Corp",
      totalValue: 125000,
      completed: 87500,
      status: "In Progress",
      startDate: "2024-01-15",
      endDate: "2024-06-30",
      progress: 70
    },
    {
      id: "JOB-002",
      name: "Retail Shopping Center",
      client: "Retail Plus",
      totalValue: 98000,
      completed: 98000,
      status: "Completed",
      startDate: "2023-11-01",
      endDate: "2024-03-15",
      progress: 100
    },
    {
      id: "JOB-003",
      name: "Warehouse Facility",
      client: "Logistics Inc",
      totalValue: 156750,
      completed: 62700,
      status: "In Progress",
      startDate: "2024-02-01",
      endDate: "2024-08-15",
      progress: 40
    },
    {
      id: "JOB-004",
      name: "Residential Complex",
      client: "Home Builders",
      totalValue: 107000,
      completed: 64200,
      status: "In Progress",
      startDate: "2024-03-01",
      endDate: "2024-09-30",
      progress: 60
    }
  ];

  const chartData = jobs.map(job => ({
    name: job.name.split(' ')[0],
    total: job.totalValue,
    completed: job.completed,
    remaining: job.totalValue - job.completed
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
      {/* Jobs Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Job Values Overview</CardTitle>
          <CardDescription>Total vs Completed work across all jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
              <Bar dataKey="remaining" fill="#e5e7eb" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Jobs</CardTitle>
              <CardDescription>
                {isConnected ? "Synced with Google Sheets" : "Sample data - connect to Google Sheets for live data"}
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
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="font-semibold">${job.totalValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="font-semibold">${job.completed.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="font-semibold">${(job.totalValue - job.completed).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium">{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  {job.startDate} → {job.endDate}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsOverview;
