// Cookie utility functions for SSO
export const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

export const setCookie = (name: string, value: string, days: number = 7): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  const hostname = window.location.hostname;
  
  // Domain detection için öncelik sırası
  let domain = '.damise.local'; // default local
  if (hostname.includes('damise.com')) {
    domain = '.damise.com';
  } else if (hostname.includes('serverdms.com')) {
    domain = '.serverdms.com';
  } else if (hostname.includes('damise.local')) {
    domain = '.damise.local';
  }
  
  const isSecure = hostname.includes('damise.com') || hostname.includes('serverdms.com');

  // Localhost/IP için host-only cookie kullan (domain ekleme)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

  const cookieStr = isLocalhost
    ? `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax;`
    : `${name}=${value}; expires=${expires.toUTCString()}; path=/; domain=${domain}; SameSite=Lax; ${isSecure ? 'Secure;' : ''}`;

  document.cookie = cookieStr;
};

export const deleteCookie = (name: string): void => {
    const hostname = window.location.hostname;
    
    // Domain detection için öncelik sırası
    let domain = '.damise.local'; // default local
    if (hostname.includes('damise.com')) {
      domain = '.damise.com';
    } else if (hostname.includes('serverdms.com')) {
      domain = '.serverdms.com';
    } else if (hostname.includes('damise.local')) {
      domain = '.damise.local';
    }
    
    const deleteCommands = [
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`,
      `${name}=; Max-Age=0; path=/; domain=${domain}`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`, // Domain olmadan da dene
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.damise.local`, // Explicit .damise.local
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.damise.com`, // Explicit .damise.com
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.serverdms.com` // Explicit .serverdms.com
    ];
    
    deleteCommands.forEach(command => {
      document.cookie = command;
    });
    
  };

export const isTokenInCookie = (): boolean => {
    return getCookie('damise_auth') !== null;
};

// SSO cookie varlığını kontrol et
export const hasSSOIndicator = (): boolean => {
  // HttpOnly cookie'leri JavaScript ile okuyamıyoruz, 
  // ancak domain bazlı cookie varlığını kontrol edebiliriz
  const cookies = document.cookie.split(';');
  return cookies.some(cookie => {
    const [name] = cookie.trim().split('=');
    return name === 'damise_auth';
  });
};

// SSO için güvenli cookie kontrol yöntemi
export const shouldCheckSSO = (): boolean => {
  // Logout flag'i varsa ve henüz yeniyse (3 saniyeden az) SSO check yapma
  const logoutFlag = sessionStorage.getItem('justLoggedOut');
  const logoutTime = sessionStorage.getItem('logoutTime');
  
  if (logoutFlag === 'true') {
    if (logoutTime) {
      const timeSinceLogout = Date.now() - parseInt(logoutTime);
      if (timeSinceLogout < 3000) { // 3 saniye
        return false;
      } else {
        // Eski flag'i temizle
        sessionStorage.removeItem('justLoggedOut');
        sessionStorage.removeItem('logoutTime');
      }
    } else {
      // Zaman damgası yoksa eski flag, temizle
      sessionStorage.removeItem('justLoggedOut');
    }
  }
  
  // HttpOnly cookie'ler için doğrudan kontrol yapamıyoruz
  // Bu durumda her zaman true dönerek API check'ine izin veriyoruz
  // Ancak error handling ile 401 hatalarını sessizce handle edeceğiz
  return true;
};

// Global logout trigger - tüm tab/window ve subdomain'lere logout sinyali gönderir
export const triggerGlobalLogout = (): void => {
  const timestamp = Date.now();
  const logoutEvent = {
    type: 'logout',
    timestamp: timestamp,
    source: window.location.hostname
  };
  
  // LocalStorage'a yaz (aynı subdomain'deki tab/window'lar için)
  try {
    localStorage.setItem('damise_global_logout', JSON.stringify(logoutEvent));
    setTimeout(() => {
      localStorage.removeItem('damise_global_logout');
    }, 100);
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
  
  // Cookie'ye yaz (farklı subdomain'ler arası iletişim için)
  setCookie('damise_logout_trigger', timestamp.toString(), 1/1440); // 1 dakika
    
  // Cookie'yi 3 saniye sonra sil (logout event yayıldıktan sonra)
  setTimeout(() => {
    deleteCookie('damise_logout_trigger');
  }, 3000);
};

// Global logout listener setup - hem localStorage hem cookie kontrolü
export const setupGlobalLogoutListener = (
  logoutCallback: () => void,
  options: { 
    checkPanelSession?: boolean,
    panelSessionCookieName?: string,
    panelSessionStorageKey?: string,
    panelSessionBroadcastKey?: string
  } = {}
): (() => void) => {
  const { 
    checkPanelSession = true,
    panelSessionCookieName = 'lansman_panel_session', // Lansman Panel için default
    panelSessionStorageKey = 'lansman_panel_session_id',
    panelSessionBroadcastKey = 'lansman_panel_session_broadcast'
  } = options;
  let lastCheckedTimestamp = Date.now();
  let isLoggingOut = false; // Prevent multiple logout calls
  let lastSeenPanelSessionId: string | null = null;
  
  const performLogout = (source: string) => {
    if (isLoggingOut) {
      return;
    }
    
    isLoggingOut = true;
    logoutCallback();
    
    // Reset after a delay
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  };
  
  // LocalStorage event handler (same subdomain, different tabs)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'damise_global_logout' && e.newValue) {
      try {
        const logoutEvent = JSON.parse(e.newValue);
        const timeSinceLogout = Date.now() - logoutEvent.timestamp;
        
        if (timeSinceLogout < 5000 && logoutEvent.timestamp > lastCheckedTimestamp) {
          lastCheckedTimestamp = logoutEvent.timestamp;
          performLogout(logoutEvent.source + ' (localStorage)');
        }
      } catch (error) {
        console.error('Error parsing localStorage logout event:', error);
      }
    }

    // Panel session broadcast - immediate cross-tab detection (sadece panel uygulamaları için)
    if (checkPanelSession && e.key === panelSessionBroadcastKey && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        const broadcastSessionId = payload.id as string;
        const broadcastTimestamp = payload.ts as number;
        const localPanelSessionId = sessionStorage.getItem(panelSessionStorageKey);
        
        // Yeni bir login broadcast'i geldi ve bu sekmenin session'ı ile farklı
        if (broadcastSessionId && localPanelSessionId && broadcastSessionId !== localPanelSessionId) {
          // Broadcast yeterince yeni mi? (5 saniyeden eski olmasın)
          const timeSinceBroadcast = Date.now() - broadcastTimestamp;
          if (timeSinceBroadcast < 5000) {
            performLogout('panel session changed (storage)');
          }
        }
      } catch (err) {
        console.error('[GlobalLogoutListener] Error parsing broadcast:', err);
      }
    }
  };
  
  // Cookie polling (cross-subdomain communication)
  const checkLogoutCookie = () => {
    const logoutCookie = getCookie('damise_logout_trigger');
    
    if (logoutCookie) {
      const cookieTimestamp = parseInt(logoutCookie);
      
      // Check if this is a new logout event (timestamp is newer than last check)
      if (cookieTimestamp > lastCheckedTimestamp) {
        const timeSinceLogout = Date.now() - cookieTimestamp;
        
        // Event should be recent (within 10 seconds) and newer than our last check
        if (timeSinceLogout < 10000) {
          lastCheckedTimestamp = cookieTimestamp;
          performLogout('cross-domain (cookie)');
        }
      }
    }

    // Panel session id değişikliği kontrolü (sadece panel uygulamaları için)
    if (checkPanelSession) {
      const currentPanelSessionIdCookie = getCookie(panelSessionCookieName);
      const localPanelSessionId = sessionStorage.getItem(panelSessionStorageKey);

      if (!lastSeenPanelSessionId && currentPanelSessionIdCookie) {
        lastSeenPanelSessionId = currentPanelSessionIdCookie;
      }

      // Cookie değişiklik kontrolü: lastSeenPanelSessionId ile karşılaştır
      if (currentPanelSessionIdCookie && localPanelSessionId) {
        // İlk set: lastSeen henüz yoksa current'ı kaydet
        if (!lastSeenPanelSessionId) {
          lastSeenPanelSessionId = currentPanelSessionIdCookie;
        }
        
        // Cookie değişmiş mi? (başka sekme login olmuş)
        if (currentPanelSessionIdCookie !== lastSeenPanelSessionId) {
          // Cookie değişmiş ve bu sekmenin local session'ı ile eşleşmiyor -> logout
          if (currentPanelSessionIdCookie !== localPanelSessionId) {
            lastSeenPanelSessionId = currentPanelSessionIdCookie;
            performLogout('panel session changed (cookie)');
            return;
          } else {
            // Bu sekme yeni login yaptı, sadece lastSeen güncelle
            lastSeenPanelSessionId = currentPanelSessionIdCookie;
          }
        }
      }
    }
  };
  
  // Set up both listeners
  window.addEventListener('storage', handleStorageChange);
  
  // Poll cookie every 200ms for faster multi-login detection (localhost test için hızlandırıldı)
  // Production'da 500ms yeterli olabilir
  const cookieCheckInterval = setInterval(checkLogoutCookie, 200);  
  // Cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(cookieCheckInterval);
  };
};
