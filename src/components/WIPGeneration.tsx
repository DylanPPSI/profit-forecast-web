
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Download, FileSpreadsheet, Calendar, TrendingUp } from "lucide-react";

interface WIPGenerationProps {
  profitabilityPercentage: number;
  fixedOverhead: number;
}

const WIPGeneration = ({ profitabilityPercentage, fixedOverhead }: WIPGenerationProps) => {
  const [selectedQuarter, setSelectedQuarter] = useState("Q1-2024");
  const [wipReport, setWipReport] = useState<any>(null);

  // Mock WIP data
  const quarters = ["Q4-2023", "Q1-2024", "Q2-2024", "Q3-2024"];

  const generateWIPReport = () => {
    // Mock WIP calculation
    const mockData = {
      quarter: selectedQuarter,
      totalRevenue: 312500,
      totalCosts: 265625,
      grossProfit: 46875,
      fixedOverhead: fixedOverhead,
      netProfit: 46875 - fixedOverhead,
      profitMargin: profitabilityPercentage,
      jobs: [
        { name: "Downtown Office", revenue: 87500, costs: 74375, profit: 13125 },
        { name: "Retail Center", revenue: 98000, costs: 83300, profit: 14700 },
        { name: "Warehouse", revenue: 62700, costs: 53295, profit: 9405 },
        { name: "Residential", revenue: 64300, costs: 54655, profit: 9645 }
      ]
    };
    setWipReport(mockData);
  };

  const pieData = wipReport ? [
    { name: "Revenue", value: wipReport.totalRevenue, color: "#3b82f6" },
    { name: "Costs", value: wipReport.totalCosts, color: "#ef4444" },
    { name: "Fixed Overhead", value: wipReport.fixedOverhead, color: "#f59e0b" },
    { name: "Net Profit", value: Math.max(0, wipReport.netProfit), color: "#10b981" }
  ] : [];

  const trendData = [
    { quarter: "Q4-2023", revenue: 287500, profit: 43125 },
    { quarter: "Q1-2024", revenue: 312500, profit: 46875 },
    { quarter: "Q2-2024", revenue: 298000, profit: 44700 },
    { quarter: "Q3-2024", revenue: 335000, profit: 50250 }
  ];

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"];

  return (
    <div className="space-y-6">
      {/* WIP Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Quarterly WIP Report</CardTitle>
          <CardDescription>
            Select a quarter and generate a comprehensive Work in Progress report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((quarter) => (
                    <SelectItem key={quarter} value={quarter}>
                      {quarter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateWIPReport} className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Generate WIP Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WIP Report Results */}
      {wipReport && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${wipReport.totalRevenue.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">For {wipReport.quarter}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Gross Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${wipReport.grossProfit.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {((wipReport.grossProfit / wipReport.totalRevenue) * 100).toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${wipReport.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${wipReport.netProfit.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">After overhead</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
                <CardDescription>Revenue, costs, and profit distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Quarterly Trends</CardTitle>
                <CardDescription>Revenue and profit trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Job Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Job Performance Breakdown</CardTitle>
                  <CardDescription>Individual job contributions to quarterly WIP</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wipReport.jobs.map((job: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{job.name}</h3>
                      <Badge variant="outline">
                        {((job.profit / job.revenue) * 100).toFixed(1)}% Margin
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium">${job.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Costs</p>
                        <p className="font-medium">${job.costs.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Profit</p>
                        <p className="font-medium text-green-600">${job.profit.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default WIPGeneration;
