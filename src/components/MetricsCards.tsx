import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Target } from "lucide-react";

interface MetricsCardsProps {
  totalJobValue: number;
  completedWork: number;
  remainingWork: number;
  projectedProfit: number;
  profitabilityPercentage: number;
  fixedOverhead: number;
}

const MetricsCards = ({
  totalJobValue = 0,
  completedWork = 0,
  remainingWork = 0,
  projectedProfit = 0,
  profitabilityPercentage = 0,
  fixedOverhead = 0,
}: MetricsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Job Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalJobValue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Across all active jobs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Work Completed</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${completedWork.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {totalJobValue > 0 ? ((completedWork / totalJobValue) * 100).toFixed(1) : 0}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Work</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${remainingWork.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Work in progress
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Profit</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">${projectedProfit.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            At {profitabilityPercentage}% margin
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsCards;
