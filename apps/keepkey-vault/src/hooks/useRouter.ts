import { useCallback } from 'react';

export const useRouter = () => {
  const push = useCallback((path: string) => {
    // For now, just log the navigation - can be enhanced later
    console.log('Navigation to:', path);
    // In a real implementation, you might use react-router-dom
    // or handle navigation differently
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const forward = useCallback(() => {
    window.history.forward();
  }, []);

  const replace = useCallback((path: string) => {
    console.log('Replace navigation to:', path);
    // In a real implementation, you might use react-router-dom
  }, []);

  return {
    push,
    back,
    forward,
    replace,
  };
}; 