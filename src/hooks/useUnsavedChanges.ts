import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook para detectar cambios no guardados y advertir al usuario antes de salir
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Advertir si hay cambios no guardados y el usuario intenta salir
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleNavigateBack = (fallbackPath: string = '/') => {
    if (hasChanges) {
      setShowWarning(true);
      setPendingNavigation(fallbackPath);
    } else {
      navigate(fallbackPath);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowWarning(false);
    setPendingNavigation(null);
  };

  const cancelNavigation = () => {
    setShowWarning(false);
    setPendingNavigation(null);
  };

  return {
    showWarning,
    confirmNavigation,
    cancelNavigation,
    handleNavigateBack,
  };
}
