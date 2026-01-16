import ssoApi from '../../../services/apiService';
import { triggerSessionExpired } from './sessionExpiredHandler';
import Cookies from 'js-cookie';

/**
 * Session Monitor - Multi-login Detection for panel
 * Periyodik olarak ve sekme görünür olduğunda session'ı kontrol eder
 */

let checkInterval: NodeJS.Timeout | null = null;

export const startSessionMonitor = () => {  
  // İlk kontrolü hemen yap
  const token = Cookies.get('adminToken');
  if (token) {
    checkSession();
  }
  
  // Her 5 saniyede bir kontrol et
  checkInterval = setInterval(() => {
    const token = Cookies.get('adminToken');
    if (token) {
      checkSession();
    } else {
      console.warn('Token yok, kontrol atlanıyor');
    }
  }, 5000); // 5 saniye 
};

export const stopSessionMonitor = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

const checkSession = async () => {
  const token = Cookies.get('adminToken');
  if (!token) {
    return;
  }
  
  try {
    // Ecosystem API'ye istek yap (multi-login detection için)
    const resp = await ssoApi.get('/users/getme');
    
  } catch (error: any) {
    const message = error?.response?.data?.message;
    const status = error?.response?.status;
    
    if (message === 'InvalidTokenMultipleLogin') {
      triggerSessionExpired();
      return;
    }
    
  }
};

// Visibility API - Sayfa görünür olduğunda hemen kontrol et
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const token = Cookies.get('adminToken');
      if (token) {
        checkSession();
      }
    }
  });
}
