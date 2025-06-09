
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Settings, TrendingUp, Calculator } from "lucide-react";

interface ProfitabilityControlsProps {
  profitabilityPercentage: number[];
  setProfitabilityPercentage: (value: number[]) => void;
  fixedOverhead: number;
  setFixedOverhead: (value: number) => void;
}

const ProfitabilityControls = ({
  profitabilityPercentage,
  setProfitabilityPercentage,
  fixedOverhead,
  setFixedOverhead
}: ProfitabilityControlsProps) => {
  // Mock data for scenario analysis
  const generateScenarioData = () => {
    const baseRevenue = 312500;
    const scenarios = [];
    
    for (let margin = 5; margin <= 30; margin += 5) {
      const grossProfit = (baseRevenue * margin) / 100;
      const netProfit = grossProfit - fixedOverhead;
      scenarios.push({
        margin,
        grossProfit,
        netProfit: Math.max(0, netProfit),
        breakeven: netProfit === 0
      });
    }
    return scenarios;
  };

  const scenarioData = generateScenarioData();
  const currentScenario = scenarioData.find(s => s.margin === profitabilityPercentage[0]);

  const calculateBreakevenRevenue = () => {
    return fixedOverhead / (profitabilityPercentage[0] / 100);
  };

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Profitability Settings</span>
            </CardTitle>
            <CardDescription>
              Adjust your target profit margin and overhead costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profit Margin Slider */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Target Profit Margin: {profitabilityPercentage[0]}%
              </Label>
              <Slider
                value={profitabilityPercentage}
                onValueChange={setProfitabilityPercentage}
                max={50}
                min={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Fixed Overhead Input */}
            <div className="space-y-3">
              <Label htmlFor="overhead" className="text-sm font-medium">
                Monthly Fixed Overhead ($)
              </Label>
              <Input
                id="overhead"
                type="number"
                value={fixedOverhead}
                onChange={(e) => setFixedOverhead(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Include rent, salaries, insurance, and other fixed costs
              </p>
            </div>

            <Button className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </CardContent>
        </Card>

        {/* Current Scenario */}
        <Card>
          <CardHeader>
            <CardTitle>Current Scenario Analysis</CardTitle>
            <CardDescription>
              Financial impact of your current settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Gross Profit</p>
                <p className="text-xl font-bold text-blue-800">
                  ${currentScenario?.grossProfit.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Net Profit</p>
                <p className="text-xl font-bold text-green-800">
                  ${currentScenario?.netProfit.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-lg">
              <p className="text-sm text-amber-600 font-medium">Breakeven Revenue</p>
              <p className="text-xl font-bold text-amber-800">
                ${calculateBreakevenRevenue().toLocaleString()}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Monthly revenue needed to cover overhead
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 font-medium">Profit Margin Impact</p>
              <p className="text-sm text-gray-800">
                Each 1% margin increase adds ~$3,125 monthly profit
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Analysis Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Margin Scenario Analysis</CardTitle>
          <CardDescription>
            See how different profit margins affect your bottom line
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="margin" 
                label={{ value: 'Profit Margin (%)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value, name) => [
                  `$${value.toLocaleString()}`, 
                  name === 'grossProfit' ? 'Gross Profit' : 'Net Profit'
                ]}
                labelFormatter={(margin) => `${margin}% Margin`}
              />
              <Area
                type="monotone"
                dataKey="grossProfit"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Gross Profit"
              />
              <Area
                type="monotone"
                dataKey="netProfit"
                stackId="2"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.8}
                name="Net Profit"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Optimization Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Conservative Approach</h3>
              <p className="text-sm text-blue-700">
                Maintain 12-15% margins for stable, predictable profits with lower risk.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Balanced Growth</h3>
              <p className="text-sm text-green-700">
                Target 18-22% margins for healthy growth while remaining competitive.
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">Aggressive Pricing</h3>
              <p className="text-sm text-amber-700">
                Push for 25%+ margins on specialized work where you have competitive advantages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitabilityControls;
