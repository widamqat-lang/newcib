import React, { createContext, useContext, useState } from 'react';

type RegistrationData = {
  fullName: string;
  phone: string;
  nationalId: string;
  username: string;
};

type RegistrationContextType = {
  data: RegistrationData;
  updateData: (newData: Partial<RegistrationData>) => void;
  reset: () => void;
};

const initialState: RegistrationData = {
  fullName: '',
  phone: '',
  nationalId: '',
  username: '',
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RegistrationData>(initialState);

  const updateData = (newData: Partial<RegistrationData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const reset = () => setData(initialState);

  return (
    <RegistrationContext.Provider value={{ data, updateData, reset }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration must be used within RegistrationProvider');
  return context;
}
