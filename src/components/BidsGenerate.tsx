import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronLeft, Settings } from "lucide-react";
import { supabase } from "@/components/GoogleSheetsConnector";

interface FormData {
  bidType: string;
  totalLF: { sewerMains: string; laterals: string; culverts: string };
  generalConditions: Record<string, string>;
  generalConditionsRates: Record<string, string>;
  mobilization: Record<string, string>;
  mobilizationRates: Record<string, string>;
  demobilization: string;
  demobilizationRate: string;
  trafficControl: Record<string, string>;
  trafficControlRates: Record<string, string>;
  automatedCamera: Record<string, string>;
  automatedCameraRates: Record<string, string>;
  cameraInspectionExistingLat: Record<string, string>;
  cameraInspectionExistingLatRates: Record<string, string>;
  cameraInspectionExistingCulvert: Record<string, string>;
  cameraInspectionExistingCulvertRates: Record<string, string>;
  pct: number; // for summary table
  // ...other summary fields as needed
}

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

const cameraInspectionExistingLat = [
  { name: "SewerAI", unit: "LF" },
  { name: "Cleaning", unit: "SHIFTS" },
  { name: "Cleaning Shifts", unit: "LF" },
  { name: "Deduct for crew optimization", unit: "LF" }
];

const cameraInspectionExistingCulvert = [
  { name: "Culvert Cleaning & Inspection Shifts", unit: "SHIFTS" },
  { name: "CulvertInspection at 121 LF/SHIFT (2-MAN CREW)", unit: "SHIFTS" },
  { name: "SewerAI", unit: "LF" }
];

const TOTAL_STEPS = 9; // 1:BidType, 2:General, 3:Mobil, 4:Demobil, 5:Traffic, 6:AutoCam, 7:Lat, 8:Culvert, 9:Summary

const defaultUnitRates = (items: any[]) =>
  Object.fromEntries(items.map(item => [item.name || item, "0.00"]));

// Example city data structure
const cityData = [
  {
    state: "California",
    counties: [
      {
        county: "San Francisco County",
        cities: ["San Francisco", "Daly City"]
      },
      {
        county: "Los Angeles County",
        cities: ["Los Angeles", "Santa Monica"]
      }
    ]
  },
  {
    state: "Nevada",
    counties: [
      {
        county: "Clark County",
        cities: ["Las Vegas", "Henderson"]
      }
    ]
  }
];

const BidsGenerate = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfig, setShowConfig] = useState(false);

  // Add unit rates and totals to formData
  const [formData, setFormData] = useState<FormData>({
    bidType: "",
    totalLF: { sewerMains: "", laterals: "", culverts: "" },
    generalConditions: {},
    generalConditionsRates: defaultUnitRates(generalConditionsItems),
    mobilization: {},
    mobilizationRates: defaultUnitRates(mobilizationItems),
    demobilization: "",
    demobilizationRate: "0.00",
    trafficControl: {},
    trafficControlRates: defaultUnitRates(trafficControlItems),
    automatedCamera: {},
    automatedCameraRates: defaultUnitRates(automatedCameraItems),
    cameraInspectionExistingLat: {},
    cameraInspectionExistingLatRates: defaultUnitRates(cameraInspectionExistingLat),
    cameraInspectionExistingCulvert: {},
    cameraInspectionExistingCulvertRates: defaultUnitRates(cameraInspectionExistingCulvert),
    pct: 0, // for summary table
    // ...other summary fields as needed
  });

  const [lateralsType, setLateralsType] = useState<"LF" | "Quantity">("LF");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Load config from localStorage/Supabase
  useEffect(() => {
    // Try localStorage first
    const localConfig = localStorage.getItem("bidsConfig");
    if (localConfig) {
      setFormData((prev: any) => ({ ...prev, ...JSON.parse(localConfig) }));
    } else {
      // Optionally fetch from Supabase
      // fetchConfigFromSupabase();
    }
  }, []);

  // Save config to localStorage/Supabase
  const saveConfig = async (config: any) => {
    localStorage.setItem("bidsConfig", JSON.stringify(config));
    // Save to Supabase as JSON file
    const blob = new Blob([JSON.stringify(config)], { type: "application/json" });
    await supabase.storage.from("settings-config").upload("Bids/config.json", blob, { upsert: true });
  };

  const updateFormData = (section: keyof FormData, key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' && prev[section] !== null
        ? { ...prev[section] as Record<string, string>, [key]: value }
        : value
    }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
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
      case 7:
        return Object.keys(formData.cameraInspectionExistingLat).length > 0;
      case 8:
        return Object.keys(formData.cameraInspectionExistingCulvert).length > 0;
      case 9:
        return formData.pct !== undefined && formData.pct !== null;
      default:
        return false;
    }
  };

  // Helper to update quantity and auto-set unit rate if needed
  const updateQuantityAndRate = (section: string, key: string, value: string, rateSection: string) => {
    setFormData((prev: any) => {
      const newSection = { ...prev[section], [key]: value };
      let newRates = { ...prev[rateSection] };
      if (value && (!newRates[key] || newRates[key] === "0.00")) {
        newRates[key] = "0.01";
      }
      return { ...prev, [section]: newSection, [rateSection]: newRates };
    });
  };

  // Helper for laterals value
  const getLateralsDisplayValue = () => {
    const val = formData.totalLF.laterals;
    if (!val) return "";
    if (lateralsType === "Quantity") {
      // Multiply by 17.5 for display
      return (parseFloat(val) * 17.5).toFixed(2);
    }
    return val;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generate New Bid</h3>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {TOTAL_STEPS}
        </div>
        <Button variant="ghost" onClick={() => setShowConfig(true)}>
          <Settings className="h-5 w-5" /> Configuration
        </Button>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h4 className="font-bold mb-4">Bid Defaults Configuration</h4>
            {/* Render config fields here, e.g. default unit rates, etc. */}
            <Button onClick={() => { saveConfig(formData); setShowConfig(false); }}>
              Save Defaults
            </Button>
            <Button variant="outline" onClick={() => setShowConfig(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Bid Type"}
            {currentStep === 2 && "General Conditions"}
            {currentStep === 3 && "Mobilization"}
            {currentStep === 4 && "Demobilization"}
            {currentStep === 5 && "Traffic Control Work"}
            {currentStep === 6 && "Automated Camera Inspection"}
            {currentStep === 7 && "Camera Inspection - Existing Laterals"}
            {currentStep === 8 && "Camera Inspection - Existing Culverts"}
            {currentStep === 9 && "Bid Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Bid Type + Totals + City Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label>Select Bid Type</Label>
              <Select
                value={formData.bidType}
                onValueChange={(value) => setFormData((prev: any) => ({ ...prev, bidType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose bid type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B (Business to Business)</SelectItem>
                  <SelectItem value="B2G">B2G (Business to Government)</SelectItem>
                </SelectContent>
              </Select>

              {/* City Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>State</Label>
                  <Select
                    value={selectedState}
                    onValueChange={val => {
                      setSelectedState(val);
                      setSelectedCounty("");
                      setSelectedCity("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {cityData.map((state) => (
                        <SelectItem key={state.state} value={state.state}>
                          {state.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>County</Label>
                  <Select
                    value={selectedCounty}
                    onValueChange={val => {
                      setSelectedCounty(val);
                      setSelectedCity("");
                    }}
                    disabled={!selectedState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select County" />
                    </SelectTrigger>
                    <SelectContent>
                      {cityData
                        .find((s) => s.state === selectedState)
                        ?.counties.map((county) => (
                          <SelectItem key={county.county} value={county.county}>
                            {county.county}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City</Label>
                  <Select
                    value={selectedCity}
                    onValueChange={setSelectedCity}
                    disabled={!selectedCounty}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {cityData
                        .find((s) => s.state === selectedState)
                        ?.counties.find((c) => c.county === selectedCounty)
                        ?.cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label>Sewer Mains LF</Label>
                  <Input
                    type="number"
                    value={formData.totalLF.sewerMains}
                    onChange={e => setFormData((prev: any) => ({
                      ...prev, totalLF: { ...prev.totalLF, sewerMains: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-1">
                    <Label className="mb-0">Laterals</Label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={lateralsType === "LF"}
                          onChange={() => setLateralsType("LF")}
                        />
                        <span className="text-xs">LF</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={lateralsType === "Quantity"}
                          onChange={() => setLateralsType("Quantity")}
                        />
                        <span className="text-xs">Quantity</span>
                      </label>
                    </div>
                  </div>
                  <Input
                    type="number"
                    value={formData.totalLF.laterals}
                    onChange={e => setFormData((prev: any) => ({
                      ...prev, totalLF: { ...prev.totalLF, laterals: e.target.value }
                    }))}
                  />
                  <span className="text-xs text-muted-foreground">
                    {lateralsType === "Quantity"
                      ? "Quantity will be multiplied by 17.5 for LF."
                      : "Enter total LF for laterals."}
                  </span>
                  {lateralsType === "Quantity" && (
                    <div className="text-xs text-blue-700 mt-1">
                      Calculated LF: {getLateralsDisplayValue()}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Culverts LF</Label>
                  <Input
                    type="number"
                    value={formData.totalLF.culverts}
                    onChange={e => setFormData((prev: any) => ({
                      ...prev, totalLF: { ...prev.totalLF, culverts: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: General Conditions */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter estimated quantities and unit rates for each general condition item
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
                        onChange={(e) =>
                          updateQuantityAndRate('generalConditions', item.name, e.target.value, 'generalConditionsRates')
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Rate"
                        className="w-24"
                        value={formData.generalConditionsRates[item.name] || "0.00"}
                        onChange={e =>
                          setFormData((prev: any) => ({
                            ...prev,
                            generalConditionsRates: {
                              ...prev.generalConditionsRates,
                              [item.name]: e.target.value
                            }
                          }))
                        }
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
                Enter quantities and unit rates for mobilization items
              </p>
              <div className="grid gap-4">
                {mobilizationItems.map((item) => (
                  <div key={item} className="flex items-center justify-between space-x-4">
                    <Label className="flex-1">{item}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        className="w-24"
                        value={formData.mobilization[item] || ""}
                        onChange={(e) => updateFormData('mobilization', item, e.target.value)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Rate"
                        className="w-24"
                        value={formData.mobilizationRates[item] || "0.00"}
                        onChange={e =>
                          setFormData((prev: any) => ({
                            ...prev,
                            mobilizationRates: {
                              ...prev.mobilizationRates,
                              [item]: e.target.value
                            }
                          }))
                        }
                      />
                    </div>
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
              <div className="flex items-center justify-between space-x-4">
                <Label className="flex-1">Demobilization Unit Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Unit Rate"
                  className="w-24"
                  value={formData.demobilizationRate}
                  onChange={e => setFormData((prev: any) => ({ ...prev, demobilizationRate: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Step 5: Traffic Control */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter quantities and unit rates for traffic control work (measured in SHIFTS)
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
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Rate"
                        className="w-24"
                        value={formData.trafficControlRates[item.name] || "0.00"}
                        onChange={e =>
                          setFormData((prev: any) => ({
                            ...prev,
                            trafficControlRates: {
                              ...prev.trafficControlRates,
                              [item.name]: e.target.value
                            }
                          }))
                        }
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
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Rate"
                        className="w-24"
                        value={formData.automatedCameraRates[item.name] || "0.00"}
                        onChange={e =>
                          setFormData((prev: any) => ({
                            ...prev,
                            automatedCameraRates: {
                              ...prev.automatedCameraRates,
                              [item.name]: e.target.value
                            }
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground w-20">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Camera Inspection Existing Laterals */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter quantities and unit rates for Camera Inspection - Existing Laterals
              </p>
              <div className="grid gap-4">
                {cameraInspectionExistingLat.map((item) => (
                  <div key={item.name} className="flex items-center justify-between space-x-4">
                    <Label className="flex-1">{item.name}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        className="w-24"
                        value={formData.cameraInspectionExistingLat[item.name] || ""}
                        onChange={e =>
                          updateQuantityAndRate('cameraInspectionExistingLat', item.name, e.target.value, 'cameraInspectionExistingLatRates')
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Rate"
                        className="w-24"
                        value={formData.cameraInspectionExistingLatRates[item.name] || "0.00"}
                        onChange={e =>
                          setFormData((prev: any) => ({
                            ...prev,
                            cameraInspectionExistingLatRates: {
                              ...prev.cameraInspectionExistingLatRates,
                              [item.name]: e.target.value
                            }
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground w-20">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Camera Inspection Existing Culverts */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter quantities and unit rates for Camera Inspection - Existing Culverts
              </p>
              <div className="grid gap-4">
                {cameraInspectionExistingCulvert.map((item) => (
                  <div key={item.name} className="flex items-center justify-between space-x-4">
                    <Label className="flex-1">{item.name}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Quantity"
                        className="w-24"
                        value={formData.cameraInspectionExistingCulvert[item.name] || ""}
                        onChange={e =>
                          updateQuantityAndRate('cameraInspectionExistingCulvert', item.name, e.target.value, 'cameraInspectionExistingCulvertRates')
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Rate"
                        className="w-24"
                        value={formData.cameraInspectionExistingCulvertRates[item.name] || "0.00"}
                        onChange={e =>
                          setFormData((prev: any) => ({
                            ...prev,
                            cameraInspectionExistingCulvertRates: {
                              ...prev.cameraInspectionExistingCulvertRates,
                              [item.name]: e.target.value
                            }
                          }))
                        }
                      />
                      <span className="text-sm text-muted-foreground w-20">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 9: Bid Summary Table */}
          {currentStep === 9 && (
            <div>
              {/* Render your summary table here, allow editing PCT and recalc */}
              <table className="min-w-full border text-xs">
                <thead>
                  <tr>
                    <th>PCT</th>
                    <th>Competitive Bid</th>
                    <th>Standard Bid</th>
                    <th>Engineer's Estimate</th>
                    <th>Only Bidder</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <Input
                        type="number"
                        value={formData.pct}
                        onChange={e => setFormData((prev: any) => ({ ...prev, pct: e.target.value }))}
                        className="w-16"
                      />
                    </td>
                    {/* Calculated columns */}
                    <td>
                      {/* Competitive Bid (0% profit) */}
                      {(
                        Object.values(formData.generalConditionsRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                        Object.values(formData.mobilizationRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                        parseFloat(formData.demobilizationRate || 0) +
                        Object.values(formData.trafficControlRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                        Object.values(formData.automatedCameraRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                        Object.values(formData.cameraInspectionExistingLatRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                        Object.values(formData.cameraInspectionExistingCulvertRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0)
                      ).toFixed(2)}
                    </td>
                    <td>
                      {/* Standard Bid (16% profit) */}
                      {(
                        (Object.values(formData.generalConditionsRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.mobilizationRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          parseFloat(formData.demobilizationRate || 0) +
                          Object.values(formData.trafficControlRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.automatedCameraRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.cameraInspectionExistingLatRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.cameraInspectionExistingCulvertRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0)
                        ) * 1.16
                      ).toFixed(2)}
                    </td>
                    <td>
                      {/* Engineer's Estimate (28.5% profit) */}
                      {(
                        (Object.values(formData.generalConditionsRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.mobilizationRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          parseFloat(formData.demobilizationRate || 0) +
                          Object.values(formData.trafficControlRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.automatedCameraRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.cameraInspectionExistingLatRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.cameraInspectionExistingCulvertRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0)
                        ) * 1.285
                      ).toFixed(2)}
                    </td>
                    <td>
                      {/* Only Bidder (33.2% profit) */}
                      {(
                        (Object.values(formData.generalConditionsRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.mobilizationRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          parseFloat(formData.demobilizationRate || 0) +
                          Object.values(formData.trafficControlRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.automatedCameraRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.cameraInspectionExistingLatRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) +
                          Object.values(formData.cameraInspectionExistingCulvertRates).reduce((a, b) => parseFloat(a) + parseFloat(b), 0)
                        ) * 1.332
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
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

            {currentStep < TOTAL_STEPS ? (
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
