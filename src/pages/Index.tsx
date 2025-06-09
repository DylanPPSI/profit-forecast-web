
import { useState } from "react";
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

const Index = () => {
  const [profitabilityPercentage, setProfitabilityPercentage] = useState([15]);
  const [fixedOverhead, setFixedOverhead] = useState(25000);
  const [isConnectedToSheets, setIsConnectedToSheets] = useState(false);
  const [sheetsConfiguration, setSheetsConfiguration] = useState<any>(null);

  const handleSheetsConnection = (connected: boolean, config?: any) => {
    setIsConnectedToSheets(connected);
    setSheetsConfiguration(config);
    
    if (connected && config) {
      console.log("Google Sheets connected with config:", config);
    }
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
        <MetricsCards profitabilityPercentage={profitabilityPercentage[0]} fixedOverhead={fixedOverhead} />

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Jobs Overview</TabsTrigger>
            <TabsTrigger value="wip">WIP Generation</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="predictor">Future Jobs</TabsTrigger>
            <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <JobsOverview 
              isConnected={isConnectedToSheets} 
              sheetsConfiguration={sheetsConfiguration} 
            />
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
