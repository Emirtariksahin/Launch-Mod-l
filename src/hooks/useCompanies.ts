import { useQuery } from '@tanstack/react-query';
import { loginAndGetToken } from '../services/tokenService';

interface Company {
  _id: string;
  name: string;
  logo: {
    url: string;
    key: string;
  };
  about: {
    tr: string;
    en: string;
  };
  sectors: string[];
  isActive: boolean;
}

const fetchAllCompanies = async (): Promise<Company[]> => {
  // Önce token al
  const token = await loginAndGetToken();
  
  let allCompanies: Company[] = [];
  let currentPage = 1;
  let hasMorePages = true;
  const limit = 50; // Sayfa başına maksimum firma sayısı
  
  while (hasMorePages) {
    // Her sayfa için API isteği gönder
    const response = await fetch(
      `${process.env.REACT_APP_DAMISE_API_URL}/company/getcompanies?page=${currentPage}&limit=${limit}`,
      {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Firmalar yüklenirken bir hata oluştu');
    }
    
    const data = await response.json();
    console.log(`Sayfa ${currentPage} API Response:`, data);
    
    let pageCompanies: Company[] = [];
    
    // API response yapısını kontrol et
    if (Array.isArray(data)) {
      pageCompanies = data;
    } else if (data && Array.isArray(data.companies)) {
      pageCompanies = data.companies;
    } else if (data && Array.isArray(data.data)) {
      pageCompanies = data.data;
    } else {
      console.error('Beklenmeyen API response yapısı:', data);
      break;
    }
    
    // Bu sayfadaki firmaları toplam listeye ekle
    allCompanies = [...allCompanies, ...pageCompanies];
    
    // Eğer bu sayfada limit'ten az firma varsa, son sayfadayız demektir
    if (pageCompanies.length < limit) {
      hasMorePages = false;
    } else {
      currentPage++;
    }
    
    // Güvenlik için maksimum 50 sayfa limiti koy
    if (currentPage > 50) {
      console.warn('Maksimum sayfa limitine ulaşıldı');
      break;
    }
  }
  
  console.log(`Toplam ${allCompanies.length} firma yüklendi`);
  return allCompanies;
};

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchAllCompanies,
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca cache'de tut
    gcTime: 10 * 60 * 1000, // 10 dakika sonra garbage collect
    retry: 2, // Hata durumunda 2 kez tekrar dene
    refetchOnWindowFocus: false, // Pencere odaklandığında tekrar fetch etme
    refetchOnMount: false, // Component mount olduğunda tekrar fetch etme (cache varsa)
  });
};

export type { Company };







