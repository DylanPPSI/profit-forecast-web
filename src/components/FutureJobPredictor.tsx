
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Target, Calculator, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface FutureJobPredictorProps {
  profitabilityPercentage: number;
  fixedOverhead: number;
}

const FutureJobPredictor = ({ profitabilityPercentage, fixedOverhead }: FutureJobPredictorProps) => {
  const [jobValue, setJobValue] = useState(150000);
  const [competitorMargin, setCompetitorMargin] = useState(12);
  const [riskLevel, setRiskLevel] = useState("medium");
  const [projectComplexity, setProjectComplexity] = useState("standard");
  const [prediction, setPrediction] = useState<any>(null);

  const generatePrediction = () => {
    // Calculate different pricing scenarios
    const baseRevenue = jobValue;
    const minMargin = Math.max(5, competitorMargin - 3);
    const targetMargin = profitabilityPercentage;
    const aggressiveMargin = Math.min(35, profitabilityPercentage + 8);

    // Risk adjustments
    const riskAdjustments = {
      low: 0,
      medium: 2,
      high: 5
    };

    const complexityAdjustments = {
      simple: -1,
      standard: 0,
      complex: 3,
      very_complex: 6
    };

    const riskAdjustment = riskAdjustments[riskLevel as keyof typeof riskAdjustments];
    const complexityAdjustment = complexityAdjustments[projectComplexity as keyof typeof complexityAdjustments];
    
    const adjustedMinMargin = minMargin + riskAdjustment + complexityAdjustment;
    const adjustedTargetMargin = targetMargin + riskAdjustment + complexityAdjustment;
    const adjustedAggressiveMargin = aggressiveMargin + riskAdjustment + complexityAdjustment;

    const scenarios = [
      {
        name: "Conservative",
        margin: adjustedMinMargin,
        bid: baseRevenue * (1 - adjustedMinMargin / 100),
        profit: baseRevenue * (adjustedMinMargin / 100),
        winProbability: 85,
        recommendation: "Safe choice - likely to win"
      },
      {
        name: "Target",
        margin: adjustedTargetMargin,
        bid: baseRevenue * (1 - adjustedTargetMargin / 100),
        profit: baseRevenue * (adjustedTargetMargin / 100),
        winProbability: 60,
        recommendation: "Balanced risk-reward"
      },
      {
        name: "Aggressive",
        margin: adjustedAggressiveMargin,
        bid: baseRevenue * (1 - adjustedAggressiveMargin / 100),
        profit: baseRevenue * (adjustedAggressiveMargin / 100),
        winProbability: 25,
        recommendation: "High profit if won"
      }
    ];

    setPrediction({
      scenarios,
      competitorMargin,
      riskFactors: {
        risk: riskLevel,
        complexity: projectComplexity,
        marketConditions: "Competitive"
      }
    });
  };

  const getRecommendationColor = (scenario: any) => {
    if (scenario.winProbability >= 70) return "bg-green-100 text-green-800";
    if (scenario.winProbability >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRecommendationIcon = (scenario: any) => {
    if (scenario.winProbability >= 70) return <CheckCircle className="h-4 w-4" />;
    if (scenario.winProbability >= 40) return <TrendingUp className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Job Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Future Job Pricing Predictor</span>
          </CardTitle>
          <CardDescription>
            Analyze pricing strategies for upcoming jobs based on market conditions and risk factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="jobValue">Estimated Job Value ($)</Label>
              <Input
                id="jobValue"
                type="number"
                value={jobValue}
                onChange={(e) => setJobValue(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitorMargin">Competitor Margin (%)</Label>
              <Input
                id="competitorMargin"
                type="number"
                value={competitorMargin}
                onChange={(e) => setCompetitorMargin(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Complexity</Label>
              <Select value={projectComplexity} onValueChange={setProjectComplexity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                  <SelectItem value="very_complex">Very Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generatePrediction} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            Generate Pricing Scenarios
          </Button>
        </CardContent>
      </Card>

      {/* Prediction Results */}
      {prediction && (
        <>
          {/* Scenario Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Scenarios</CardTitle>
              <CardDescription>
                Different pricing strategies with win probability and profit analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {prediction.scenarios.map((scenario: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{scenario.name} Bid</h3>
                      <Badge className={getRecommendationColor(scenario)}>
                        {getRecommendationIcon(scenario)}
                        <span className="ml-1">{scenario.winProbability}%</span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bid Amount:</span>
                        <span className="font-medium">${scenario.bid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Profit Margin:</span>
                        <span className="font-medium">{scenario.margin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Expected Profit:</span>
                        <span className="font-medium text-green-600">${scenario.profit.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded text-xs text-gray-700">
                      {scenario.recommendation}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={prediction.scenarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Win Probability (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'winProbability' ? `${value}%` : `$${value.toLocaleString()}`,
                      name === 'winProbability' ? 'Win Probability' : name === 'bid' ? 'Bid Amount' : 'Expected Profit'
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bid" fill="#3b82f6" name="Bid Amount" />
                  <Bar yAxisId="left" dataKey="profit" fill="#10b981" name="Expected Profit" />
                  <Line yAxisId="right" type="monotone" dataKey="winProbability" stroke="#ef4444" strokeWidth={3} name="Win Probability" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis & Recommendations</CardTitle>
              <CardDescription>
                Factors affecting your pricing strategy for this job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Risk Factors</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <Badge variant="outline">{prediction.riskFactors.risk}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Project Complexity:</span>
                      <Badge variant="outline">{prediction.riskFactors.complexity}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Conditions:</span>
                      <Badge variant="outline">{prediction.riskFactors.marketConditions}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Competitor Margin:</span>
                      <Badge variant="outline">{competitorMargin}%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Strategic Recommendations</h3>
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Market Position</p>
                      <p className="text-xs text-blue-700">
                        Consider your relationship with this client and recent win rates
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Capacity Planning</p>
                      <p className="text-xs text-green-700">
                        Factor in current workload and resource availability
                      </p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-amber-800">Risk Mitigation</p>
                      <p className="text-xs text-amber-700">
                        Include contingencies for {riskLevel} risk projects
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FutureJobPredictor;
