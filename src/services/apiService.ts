import axios from 'axios';
import Cookies from 'js-cookie';
import { triggerSessionExpired } from '../utils/sessionExpiredHandler';

// Axios instance oluşturma
const rawBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// URL'yi düzgün bir şekilde oluştur
let baseURL: string;
if (!rawBase) {
  baseURL = 'http://localhost:5000';
} else if (rawBase.startsWith('http://') || rawBase.startsWith('https://')) {
  baseURL = rawBase;
} else {
  // Hiç protokol yoksa http:// ekle
  baseURL = `http://${rawBase}`;
}
const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Her istekte otomatik olarak Authorization başlığına token'ı ekleyin, SEO endpoint'leri ve login hariç
api.interceptors.request.use((config) => {
  const token = Cookies.get('adminToken');

  // headers nesnesi undefined ise onu boş bir nesne olarak ayarla
  if (!config.headers) {
    config.headers = {};
  }

  // x-project-type header'ı ekle (multi-login detection için)
  config.headers['x-project-type'] = 'dl';

  // SEO endpoint'leri ve login endpoint'i için Authorization header eklenmesini atla
  const skipAuthUrls = ['/seosettings', '/api/login', '/login'];
  const shouldSkipAuth = skipAuthUrls.some(url => config.url?.includes(url));
  
  if (!shouldSkipAuth && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor - multi-login detection
api.interceptors.response.use(
  (response) => {
    console.log('[api] Response success:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    const message = error?.response?.data?.message;
    const status = error?.response?.status;
    const url = error?.config?.url;
    
    console.error('[api] Response error:', {
      status,
      url,
      message,
      error: error?.response?.data?.error
    });
    
    // Multi-login detection
    if (message === 'InvalidTokenMultipleLogin') {
      triggerSessionExpired();
    }
    
    return Promise.reject(error);
  }
);

// Lansman listesini alma fonksiyonu
export const getLaunchList = async () => {
  try {
    const response = await api.get(`/launch-list`);
    return response.data;
  } catch (error) {
    console.error('API request error: ', error);
    throw error;
  }
};

// SEO verilerini çekme fonksiyonu (Authorization gerekmeden)
export const getSeoData = async (launchId: string) => {
  try {
    const response = await api.get(`/seosettings/${launchId}`);
    return response.data;
  } catch (error) {
    console.error(`SEO verileri alınamadı: ${launchId}`, error);
    throw error;
  }
};

// SSO için ayrı axios instance (Ecosystem API'ye bağlanır)
export const ssoApi = axios.create({
  baseURL: process.env.REACT_APP_DAMISE_API_URL || 'https://api-ekosistem.damise.com',
  withCredentials: true, // SSO cookie support for all domains
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// SSO API request interceptor - project type and Authorization
ssoApi.interceptors.request.use((config: any) => {
  if (!config.headers) {
    config.headers = {} as any;
  }
  // Panel uygulaması için x-project-type: dl (lansman project)
  // NOT: 'ecosystem' kullanırsak backend MultipleLogin kontrolü yapmaz
  // 'dl' kullanarak backend'in MultipleLogin kontrolünü aktif ediyoruz
  (config.headers as any)['x-project-type'] = 'dl';
  const token = Cookies.get('adminToken');
  
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// SSO API response interceptor - multi-login detection
ssoApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error?.response?.data?.message;
    const status = error?.response?.status;
    const url = error?.config?.url;
    
    console.error('Hata yanıtı:', { 
      status, 
      url, 
      message,
      fullData: error?.response?.data 
    });
    
    if (message === 'InvalidTokenMultipleLogin') {
      triggerSessionExpired();
    }
    return Promise.reject(error);
  }
);
// DAMISE API'sinden firmaları çekme fonksiyonu
export const getDamiseCompanies = async () => {
  try {
    // Token service'i import etmek yerine, bu fonksiyonu kullanacak yerde token'ı parametre olarak geçeceğiz
    // Bu fonksiyon artık kullanılmayacak, CompanySelector'da doğrudan fetch yapıyoruz
    const response = await fetch(`${process.env.REACT_APP_DAMISE_API_URL}/company/getcompanies`);
    if (!response.ok) {
      throw new Error('Firmalar yüklenirken bir hata oluştu');
    }
    return await response.json();
  } catch (error) {
    console.error('DAMISE API request error: ', error);
    throw error;
  }
};

export default api;