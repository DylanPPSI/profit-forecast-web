import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";

const BidsBacklog = () => {
  // Mock data for bids in backlog
  const [bids] = useState([
    {
      id: 1,
      name: "Downtown Sewer Inspection Project",
      type: "B2G",
      status: "Generated",
      dateCreated: "2024-12-15",
      totalValue: 125000,
    },
    {
      id: 2,
      name: "Commercial Complex CCTV Survey",
      type: "B2B",
      status: "Uploaded",
      dateCreated: "2024-12-10",
      totalValue: 85000,
    },
    {
      id: 3,
      name: "Municipal Pipeline Assessment",
      type: "B2G",
      status: "Generated",
      dateCreated: "2024-12-08",
      totalValue: 195000,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Generated":
        return "bg-green-100 text-green-800 border-green-200";
      case "Uploaded":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bids Backlog</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {bids.length} Bids
        </Badge>
      </div>

      <div className="grid gap-4">
        {bids.map((bid) => (
          <Card key={bid.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{bid.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Created on {new Date(bid.dateCreated).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(bid.status)}>
                    {bid.status}
                  </Badge>
                  <Badge variant="outline">
                    {bid.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Estimated Value: <span className="font-medium text-foreground">
                    ${bid.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bids.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bids in backlog</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BidsBacklog;