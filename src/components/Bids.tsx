import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BidsBacklog from "./BidsBacklog";
import BidsGenerate from "./BidsGenerate";

const Bids = () => {
  const [activeSubTab, setActiveSubTab] = useState("backlog");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bids Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="backlog">Backlog</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>

            <TabsContent value="backlog" className="mt-6">
              <BidsBacklog />
            </TabsContent>

            <TabsContent value="generate" className="mt-6">
              <BidsGenerate />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bids;