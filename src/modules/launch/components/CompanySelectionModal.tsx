import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';

export interface Company {
  _id: string;
  name: string;
  logo: {
    url: string;
  };
}
//burayı değiştirdim
interface CompanySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (company: Company) => void;
  selectedCompanyId?: string;
}

interface ProgressInfo {
  current: number;
  total: number;
  page: number;
  percentage: number;
}

const CompanySelectionModal: React.FC<CompanySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCompanyId,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Modal açıldığında şirketleri yükle
  useEffect(() => {
    if (isOpen && companies.length === 0) {
      loadCompaniesProgressively();
    }

    // Modal kapandığında EventSource'u kapat
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen]);

  // Arama filtresi
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const loadCompaniesProgressively = () => {
    setLoading(true);
    setError(null);
    setCompleted(false);
    setCompanies([]);
    setProgress(null);

    try {
      const eventSource = new EventSource(
        `${process.env.REACT_APP_API_URL}/ecosystem-companies/progressive`
      );
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setError(data.message);
            setLoading(false);
            eventSource.close();
            return;
          }

          if (data.completed) {
            console.log('✅ Tüm şirketler yüklendi:', data.total);
            setCompleted(true);
            setLoading(false);
            eventSource.close();
            return;
          }

          if (data.companies && Array.isArray(data.companies)) {
            // Yeni şirketleri ekle
            setCompanies(prev => {
              const newCompanies = [...prev];
              data.companies.forEach((company: Company) => {
                // Duplicate kontrolü
                if (!newCompanies.find(c => c._id === company._id)) {
                  newCompanies.push(company);
                }
              });
              return newCompanies;
            });

            // Progress bilgisini güncelle
            if (data.progress) {
              setProgress(data.progress);
            }
          }
        } catch (err) {
          console.error('Event parse error:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        setError('Şirketler yüklenirken bir hata oluştu');
        setLoading(false);
        eventSource.close();
      };
    } catch (err: any) {
      setError(err.message || 'Bağlantı hatası');
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    onSelect(company);
    onClose();
  };

  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Şirket Seç"
      className="bg-white p-6 rounded-lg shadow-2xl max-w-4xl w-full mx-auto mt-10 max-h-[80vh] overflow-hidden flex flex-col"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[600] flex justify-center items-center"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <div>
          <h3 className="text-xl font-semibold text-[#192055]">Ekosistem Şirketi Seç</h3>
          {progress && (
            <p className="text-sm text-gray-600 mt-1">
              {completed ? (
                `✅ ${companies.length} şirket yüklendi`
              ) : (
                `📥 Yükleniyor: ${progress.current} / ${progress.total} (%${progress.percentage})`
              )}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
        >
          &times;
        </button>
      </div>

      {/* Progress Bar */}
      {loading && progress && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Şirket ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-600 mt-2">
          {filteredCompanies.length} şirket bulundu
          {searchQuery && ` ("${searchQuery}" araması için)`}
        </p>
      </div>

      {/* Companies Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredCompanies.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">
            {companies.length === 0
              ? 'Henüz şirket yüklenmedi'
              : 'Arama kriterine uygun şirket bulunamadı'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <div
                key={company._id}
                onClick={() => handleCompanySelect(company)}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all duration-200
                  hover:shadow-lg hover:border-blue-500 hover:scale-105
                  ${selectedCompanyId === company._id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  {/* Logo */}
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {company.logo?.url ? (
                      <img
                        src={company.logo.url}
                        alt={company.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="40"%3E?%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="text-3xl text-gray-400">🏢</div>
                    )}
                  </div>
                  
                  {/* Company Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate" title={company.name}>
                      {company.name}
                    </p>
                    {selectedCompanyId === company._id && (
                      <span className="text-xs text-blue-600 font-semibold">✓ Seçili</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {loading && !completed && 'Arka planda yükleme devam ediyor...'}
        </p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          İptal
        </button>
      </div>
    </Modal>
  );
};

export default CompanySelectionModal;

