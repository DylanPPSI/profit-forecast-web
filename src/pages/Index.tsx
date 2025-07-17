import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, TrendingUp, DollarSign, Settings, Download, Upload } from "lucide-react";
import JobsOverview from "@/components/JobsOverview";
import WIPGeneration from "@/components/WIPGeneration";
import ProfitabilityControls from "@/components/ProfitabilityControls";
import FutureJobPredictor from "@/components/FutureJobPredictor";
import MetricsCards from "@/components/MetricsCards";
import GoogleSheetsConnector from "@/components/GoogleSheetsConnector";
import ProgressTracker from "@/components/ProgressTracker";
import { SpeedInsights } from "@vercel/speed-insights/next"
import Bids from "@/components/Bids";

// Example: these would come from your context or props
const isConnectedToSheets = true;
const sheetsConfiguration = {};

const Index = () => {
  const [profitabilityPercentage, setProfitabilityPercentage] = useState([20]);
  const [fixedOverhead, setFixedOverhead] = useState(0);

  // Metrics state, updated by JobsOverview
  const [metrics, setMetrics] = useState({
    totalJobValue: 0,
    completedWork: 0,
    remainingWork: 0,
    projectedProfit: 0,
  });

  // Persisted tab state
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("dashboardTab") || "overview";
  });

  useEffect(() => {
    localStorage.setItem("dashboardTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("metrics", JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    const savedMetrics = localStorage.getItem("metrics");
    if (savedMetrics) setMetrics(JSON.parse(savedMetrics));
  }, []);

  const handleSheetsConnection = () => {
    // Logic to handle Google Sheets connection
    console.log("Connect to Google Sheets");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WIP Dashboard</h1>
                <p className="text-sm text-gray-600">Quarterly Work in Progress Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isConnectedToSheets && sheetsConfiguration && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  {sheetsConfiguration.fileName}
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        {!isConnectedToSheets && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Upload className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-amber-800 font-medium">Connect to Google Sheets</p>
                  <p className="text-amber-700 text-sm">Connect your Google Sheets to sync job data and enable real-time WIP generation.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Overview */}
        <MetricsCards
          totalJobValue={metrics.totalJobValue}
          completedWork={metrics.completedWork}
          remainingWork={metrics.remainingWork}
          projectedProfit={metrics.projectedProfit}
          profitabilityPercentage={profitabilityPercentage[0]}
          fixedOverhead={fixedOverhead}
        />

        {/* Main Dashboard Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          defaultValue="overview"
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Jobs Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress Tracker</TabsTrigger>
            <TabsTrigger value="bids">Bids</TabsTrigger>
            <TabsTrigger value="wip">WIP Generation</TabsTrigger>
            <TabsTrigger value="bids">Bids</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="predictor">Future Jobs</TabsTrigger>
            <TabsTrigger value="sheets">Supabase</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <JobsOverview
              isConnected={isConnectedToSheets}
              sheetsConfiguration={sheetsConfiguration}
              profitabilityPercentage={profitabilityPercentage[0]}
              onMetricsChange={setMetrics}
            />
          </TabsContent>
          
          <TabsContent value="progress">
            <ProgressTracker />
          </TabsContent>

          <TabsContent value="bids">
            <Bids />
          </TabsContent>

          <TabsContent value="wip">
            <WIPGeneration
              profitabilityPercentage={profitabilityPercentage[0]}
              fixedOverhead={fixedOverhead}
            />
          </TabsContent>

          <TabsContent value="profitability">
            <ProfitabilityControls
              profitabilityPercentage={profitabilityPercentage}
              setProfitabilityPercentage={setProfitabilityPercentage}
              fixedOverhead={fixedOverhead}
              setFixedOverhead={setFixedOverhead}
            />
          </TabsContent>

          <TabsContent value="predictor">
            <FutureJobPredictor
              profitabilityPercentage={profitabilityPercentage[0]}
              fixedOverhead={fixedOverhead}
            />
          </TabsContent>

          <TabsContent value="sheets">
            <GoogleSheetsConnector onConnectionChange={handleSheetsConnection} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
