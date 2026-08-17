import { useEffect, useState } from 'react';

const OFFICER_PASSCODE = 'M0##y30$$';
const STORAGE_KEY = 'familia_officer_unlocked';

export function useOfficerLock() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (unlocked) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [unlocked]);

  const tryUnlock = (code: string) => {
    if (code === OFFICER_PASSCODE) {
      setUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => setUnlocked(false);

  return { unlocked, tryUnlock, lock, passcode: OFFICER_PASSCODE };
}
