import { createContext, useContext, useState } from "react";

const SheetContext = createContext<any>(null);

export const SheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [sheetConfig, setSheetConfig] = useState<any>(null);
  return (
    <SheetContext.Provider value={{ sheetConfig, setSheetConfig }}>
      {children}
    </SheetContext.Provider>
  );
};

export const useSheet = () => useContext(SheetContext);