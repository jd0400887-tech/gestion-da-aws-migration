import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useStaffingRequests } from '../hooks/useStaffingRequests';

// Infer the return type of the hook
type StaffingRequestsHookType = ReturnType<typeof useStaffingRequests>;

const StaffingRequestsContext = createContext<StaffingRequestsHookType | undefined>(undefined);

export const StaffingRequestsProvider = ({ children }: { children: ReactNode }) => {
  const staffingRequests = useStaffingRequests();

  // Aseguramos que al montar el proveedor se sincronicen los datos
  useEffect(() => {
    staffingRequests.fetchRequests();
  }, []);

  return (
    <StaffingRequestsContext.Provider value={staffingRequests}>
      {children}
    </StaffingRequestsContext.Provider>
  );
};

export const useStaffingRequestsContext = () => {
  const context = useContext(StaffingRequestsContext);
  if (context === undefined) {
    throw new Error('useStaffingRequestsContext must be used within a StaffingRequestsProvider');
  }
  return context;
};
