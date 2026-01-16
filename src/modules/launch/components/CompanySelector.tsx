import React, { useState } from 'react';
import Modal from 'react-modal';
import { useCompanies, Company } from '../../../hooks';

interface CompanySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (companyId: string, companyName: string) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // TanStack Query hook'unu kullan
  const { data: companies = [], isLoading, error, isError } = useCompanies();


  const filteredCompanies = Array.isArray(companies) ? companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    company.isActive
  ) : [];

  const handleCompanySelect = (company: Company) => {
    onSelect(company._id, company.name);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Firma Seç"
      className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full mx-auto mt-10 max-h-[80vh] overflow-hidden flex flex-col"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex justify-center items-center"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#192055]">Ekosistem Şirketi Seç</h3>
        <button onClick={onClose} className="text-gray-500 text-xl hover:text-gray-700">
          &times;
        </button>
      </div>

      {/* Arama kutusu */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Firma ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* İçerik alanı */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex flex-col justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#192055]"></div>
            <span className="ml-2 text-gray-600 mt-2">
              Firmalar yükleniyor...
            </span>
          </div>
        )}

        {isError && (
          <div className="text-red-600 text-center p-4">
            {error?.message || 'Firmalar yüklenirken bir hata oluştu'}
            <div className="mt-2 text-sm text-gray-600">
              Sayfa yenilendiğinde tekrar denenecek
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 p-8">
                {searchTerm ? 'Arama kriterlerine uygun firma bulunamadı.' : 'Aktif firma bulunamadı.'}
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <div
                  key={company._id}
                  onClick={() => handleCompanySelect(company)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 flex flex-col items-center text-center"
                >
                  {/* Logo */}
                  <div className="w-16 h-16 mb-3 flex items-center justify-center">
                    {company.logo?.url ? (
                      <img
                        src={company.logo.url}
                        alt={company.name}
                        className="max-w-full max-h-full object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-16 h-16 bg-gray-200 rounded flex items-center justify-center ${company.logo?.url ? 'hidden' : ''}`}>
                      <span className="text-gray-400 text-xs">Logo Yok</span>
                    </div>
                  </div>

                  {/* Firma adı */}
                  <h4 className="font-medium text-gray-800 text-sm leading-tight mb-2 line-clamp-2">
                    {company.name}
                  </h4>

                  {/* Açıklama (kısaltılmış) */}
                  {company.about?.tr && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {company.about.tr.length > 100
                        ? `${company.about.tr.substring(0, 100)}...`
                        : company.about.tr}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Alt butonlar */}
      <div className="flex justify-end mt-4 pt-4 border-t">
        <button
          onClick={onClose}
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
        >
          İptal
        </button>
      </div>
    </Modal>
  );
};

export default CompanySelector;

