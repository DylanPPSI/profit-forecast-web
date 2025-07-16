
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface FormData {
  bidType: string;
  generalConditions: Record<string, string>;
  mobilization: Record<string, string>;
  demobilization: string;
  trafficControl: Record<string, string>;
  automatedCamera: Record<string, string>;
}

const BidsGenerate = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    bidType: "",
    generalConditions: {},
    mobilization: {},
    demobilization: "",
    trafficControl: {},
    automatedCamera: {},
  });

  const generalConditionsItems = [
    { name: "PM", unit: "HOURS" },
    { name: "PE", unit: "HOURS" },
    { name: "SUPER", unit: "EA" },
    { name: "Grids", unit: "LOCATIONS" },
    { name: "Drainage ID's", unit: "LOCATIONS" },
    { name: "Caltrans Permit", unit: "EA" },
    { name: "Port of SF Permit", unit: "EA" },
    { name: "Public Notices", unit: "EA" },
    { name: "SFDPW TOC PERMIT", unit: "EA" },
    { name: "Night Noise", unit: "EA" },
    { name: "Special Traffic Permit", unit: "EA" },
    { name: "School District Communications", unit: "EA" },
  ];

  const mobilizationItems = [
    "HD LATERAL LAUNCH SYSTEM ACQUISITION 1 - ENVIROSIGHT UNIT",
    "HD LATERAL LAUNCH SYSTEM ACQUISITION 2 - IBAK UNIT",
    "4K INSPECTION UNIT - DEEP TREKKER",
  ];

  const trafficControlItems = [
    { name: "TRAFFIC CONTROL WORK (cleaning the & inspection)", unit: "SHIFTS" },
    { name: "Traffic Control for Project - (1-MAN TC CREW)", unit: "SHIFTS" },
    { name: "Traffic Control for Project - (2-MAN TC CREW)", unit: "SHIFTS" },
  ];

  const automatedCameraItems = [
    { name: "6-18'' mainline", unit: "LF" },
    { name: "CCTV Inspection SHIFT (2-MAN CREW)", unit: "SHIFTS" },
    { name: "CLEANING - AQUASTAR", unit: "LF" },
    { name: "Added time for 20\" to 36\" and 19\"x30\" to 28\"x42\"", unit: "LF" },
    { name: "SewerAI", unit: "LF" },
    { name: "Material Classification and Sampling (Dysert) - Analytical", unit: "EA" },
    { name: "Material Transportation", unit: "TON" },
    { name: "Material Disposal (CY Calc)", unit: "CY" },
    { name: "Material Disposal", unit: "TON" },
    { name: "Material handling, loading", unit: "SHIFTS" },
  ];

  const updateFormData = (section: keyof FormData, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section] as Record<string, string>, [key]: value }
        : value
    }));
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.bidType !== "";
      case 2:
        return Object.keys(formData.generalConditions).length > 0;
      case 3:
        return Object.keys(formData.mobilization).length > 0;
      case 4:
        return formData.demobilization !== "";
      case 5:
        return Object.keys(formData.trafficControl).length > 0;
      case 6:
        return Object.keys(formData.automatedCamera).length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generate New Bid</h3>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of 6
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Bid Type"}
            {currentStep === 2 && "General Conditions"}
            {currentStep === 3 && "Mobilization"}
            {currentStep === 4 && "Demobilization"}
            {currentStep === 5 && "Traffic Control Work"}
            {currentStep === 6 && "Automated Camera Inspection"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Bid Type */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label>Select Bid Type</Label>
              <Select
                value={formData.bidType}
                onValueChange={(value) => updateFormData('bidType', '', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose bid type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B (Business to Business)</SelectItem>
                  <SelectItem value="B2G">B2G (Business to Government)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: General Conditions */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter estimated quantities for each general condition item
              </p>
              <div className="grid gap-4">
                {generalConditionsItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between space-x-4">
                    <Label className="flex-1">{item.name}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        className="w-24"
                        value={formData.generalConditions[item.name] || ""}
                        onChange={(e) => updateFormData('generalConditions', item.name, e.target.value)}
                      />
                      <span className="text-sm text-muted-foreground w-20">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Mobilization */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter quantities for mobilization items
              </p>
              <div className="grid gap-4">
                {mobilizationItems.map((item) => (
                  <div key={item} className="flex items-center justify-between space-x-4">
                    <Label className="flex-1">{item}</Label>
                    <Input
                      type="number"
                      placeholder="Quantity"
                      className="w-24"
                      value={formData.mobilization[item] || ""}
                      onChange={(e) => updateFormData('mobilization', item, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Demobilization */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-4">
                <Label className="flex-1">Demobilization Quantity</Label>
                <Input
                  type="number"
                  placeholder="Quantity"
                  className="w-24"
                  value={formData.demobilization}
                  onChange={(e) => updateFormData('demobilization', '', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 5: Traffic Control */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter quantities for traffic control work (measured in SHIFTS)
              </p>
              <div className="grid gap-4">
                {trafficControlItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between space-x-4">
                    <Label className="flex-1">{item.name}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        className="w-24"
                        value={formData.trafficControl[item.name] || ""}
                        onChange={(e) => updateFormData('trafficControl', item.name, e.target.value)}
                      />
                      <span className="text-sm text-muted-foreground w-20">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Automated Camera Inspection */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Automated Camera Inspection of Main Sewers up to and including 36 inches wide
              </p>
              <div className="grid gap-4">
                {automatedCameraItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between space-x-4">
                    <Label className="flex-1">{item.name}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        className="w-24"
                        value={formData.automatedCamera[item.name] || ""}
                        onChange={(e) => updateFormData('automatedCamera', item.name, e.target.value)}
                      />
                      <span className="text-sm text-muted-foreground w-20">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            {currentStep < 6 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => console.log('Generate bid', formData)}>
                Generate Bid
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BidsGenerate;
