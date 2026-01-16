// Global session expired modal handler with cross-tab synchronization

type SessionExpiredCallback = () => void;

let sessionExpiredCallback: SessionExpiredCallback | null = null;

// localStorage key for cross-tab/cross-project synchronization
const MODAL_FLAG_KEY = 'damise_multiplelogin_modal_showing';
const MODAL_TIMESTAMP_KEY = 'damise_multiplelogin_modal_timestamp';
const MODAL_TIMEOUT = 30000; // 30 saniye - modal otomatik kapanırsa flag temizlenir

export const setSessionExpiredHandler = (callback: SessionExpiredCallback) => {
    sessionExpiredCallback = callback;
};

// Flag'i temizle - modal kapatıldığında veya logout tamamlandığında
export const clearModalFlag = () => {
    try {
        localStorage.removeItem(MODAL_FLAG_KEY);
        localStorage.removeItem(MODAL_TIMESTAMP_KEY);
        sessionStorage.removeItem('showingMultipleLoginModal');
    } catch (e) {
        console.error('[clearModalFlag] Error:', e);
    }
};

// Eski flag'leri otomatik temizle
const cleanupOldFlags = () => {
    try {
        const timestampStr = localStorage.getItem(MODAL_TIMESTAMP_KEY);
        if (timestampStr) {
            const timestamp = parseInt(timestampStr);
            const age = Date.now() - timestamp;
            
            // 30 saniyeden eski flag'ler otomatik temizlenir
            if (age > MODAL_TIMEOUT) {
                clearModalFlag();
            }
        }
    } catch (e) {
        console.error('[cleanupOldFlags] Error:', e);
    }
};

export const triggerSessionExpired = () => {
    // Önce eski flag'leri temizle
    cleanupOldFlags();
    
    // localStorage kontrolü - TÜM sekmeler ve projeler arası
    try {
        const existingFlag = localStorage.getItem(MODAL_FLAG_KEY);
        const existingTimestamp = localStorage.getItem(MODAL_TIMESTAMP_KEY);
        
        if (existingFlag === 'true' && existingTimestamp) {
            const timestamp = parseInt(existingTimestamp);
            const age = Date.now() - timestamp;
            
            // Son 5 saniye içinde modal açılmışsa, tekrar açma
            if (age < 5000) {
                return;
            }
        }
        
        // Flag'i SET ET - localStorage (cross-tab) + sessionStorage (backward compat)
        const timestamp = Date.now().toString();
        localStorage.setItem(MODAL_FLAG_KEY, 'true');
        localStorage.setItem(MODAL_TIMESTAMP_KEY, timestamp);
        sessionStorage.setItem('showingMultipleLoginModal', 'true');
                
    } catch (e) {
        console.error('[triggerSessionExpired] localStorage error:', e);
        // localStorage fail ederse sessionStorage kullan
        sessionStorage.setItem('showingMultipleLoginModal', 'true');
    }
    
    if (sessionExpiredCallback) {
        sessionExpiredCallback();
    } else {
        // Fallback to alert if modal handler not set
        alert('Başka bir cihaz veya tarayıcıdan giriş yapıldığı için oturumunuz sonlandırıldı. Lütfen tekrar giriş yapın.');
        clearModalFlag();
        window.location.href = '/admin-login';
    }
};

