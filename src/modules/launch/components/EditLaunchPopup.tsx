import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import useLaunchStore, { LaunchData } from '../store/launchStore';
import Switch from '@mui/material/Switch';
import ImageSelector from './MediaSelector';
import { S3File } from '../services/types';
import { api } from '../../../services'; // API servislerini içe aktarın
import CompanySelectionModal, { Company } from './CompanySelectionModal';
import Select from 'react-select';
import Flag from 'react-world-flags';
Modal.setAppElement('#root');

interface EditLaunchPopupProps {
  launchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLaunch: LaunchData) => void;
  onDelete: (deletedLaunchId: string) => void;
}

const EditLaunchPopup: React.FC<EditLaunchPopupProps> = ({ launchId, isOpen, onClose, onSave, onDelete }) => {
  const { formData, setFormData, resetFormData } = useLaunchStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingHomepageLaunch, setExistingHomepageLaunch] = useState<LaunchData | null>(null); // Ana sayfa lansmanını tutar
  const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false); // Ana sayfa overwrite modal state'i
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Lansman silme modal state'i
  const [errorMessage] = useState<string | null>(null);
  const [logoSelectorOpen, setLogoSelectorOpen] = useState(false);
  const [companySelectionOpen, setCompanySelectionOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  useEffect(() => {
    const fetchLaunchData = async () => {
      try {
        const response = await api.get(`/launch/${launchId}`);
        const launchData = response.data as LaunchData;
        setFormData({
          ...launchData,
          startDate: launchData.startDate ? new Date(launchData.startDate).toISOString().split('T')[0] : '',
          endDate: launchData.endDate ? new Date(launchData.endDate).toISOString().split('T')[0] : '',
        });

        // Eğer ecosystemCompanyId varsa, selectedCompany'yi set et
        if (launchData.ecosystemCompanyId) {
          setSelectedCompany({
            _id: launchData.ecosystemCompanyId,
            name: launchData.companyName || 'Seçili Şirket',
            logo: { url: launchData.companyLogo || '' }
          });
        }
      } catch (error) {
        console.error('Etkinlik verileri alınırken bir hata oluştu:', error);
      }
    };

    if (isOpen) {
      fetchLaunchData();
    }

    return () => {
      if (!isOpen) {
        resetFormData();
        setSelectedCompany(null);
      }
    };
  }, [launchId, isOpen, setFormData, resetFormData]);

  const handleLogoSelect = (file: S3File) => {
    setFormData({
      ...formData,
      companyLogo: file.url,
    });
    setSelectedFile(null);
    setLogoSelectorOpen(false);
  };
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      ...formData,
      ecosystemCompanyId: company._id,
      companyName: company.name,
      companyLogo: company.logo.url
    });
    setCompanySelectionOpen(false);
  };

  // Kaydet işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Eğer ana sayfa seçeneği aktifse, başka bir ana sayfa lansmanını kontrol et
    if (formData.showOnHomepage) {
      try {
        const response = await api.get<LaunchData[]>(`${process.env.REACT_APP_API_URL}/launch`);
        const homepageLaunch = response.data.find((launch) => launch.showOnHomepage && launch._id !== launchId);
        if (homepageLaunch) {
          setExistingHomepageLaunch(homepageLaunch); // Mevcut ana sayfa lansmanını sakla
          setIsOverwriteModalOpen(true); // Modal'ı aç
          return; // Kaydetme işlemini durdur
        }
      } catch (error) {
        console.error('Mevcut lansman kontrol edilirken bir hata oluştu:', error);
      }
    }

    // Eğer başka bir ana sayfa lansmanı yoksa doğrudan kaydet
    await saveLaunch();
  };

  // Lansmanı kaydet
  const saveLaunch = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append('launchName', formData.launchName);
    formDataToSend.append('language', formData.language);
    formDataToSend.append('groupNumber', formData.groupNumber);
    formDataToSend.append('companyName', formData.companyName);
    formDataToSend.append('startDate', formData.startDate);
    formDataToSend.append('endDate', formData.endDate);
    formDataToSend.append('orderNumber', formData.orderNumber);
    formDataToSend.append('isActive', formData.isActive.toString());

    if (formData.showOnHomepage) {
      formDataToSend.append('showOnHomepage', formData.showOnHomepage.toString());
    }

    if (selectedFile) {
      formDataToSend.append('companyLogo', selectedFile);
    } else {
      formDataToSend.append('companyLogo', formData.companyLogo);
    }
    if (formData.ecosystemCompanyId) { formDataToSend.append('ecosystemCompanyId', formData.ecosystemCompanyId); }

    try {
      const response = await api.put(`/launch/${launchId}`, formDataToSend);
      const updatedLaunch = response.data as LaunchData;
      onSave(updatedLaunch);
      onClose();
    } catch (error: any) {
      console.error('Veriler güncellenirken bir hata oluştu:', error.response?.data || error.message);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/launch/${launchId}`);
      onDelete(launchId);
      onClose();
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        // Hata mesajını kullanıcıya göster
        alert(error.response.data.message);
      } else {
        console.error('Lansman silinirken bir hata oluştu:', error);
      }
    }
  };

  // "Evet" veya "Hayır" seçildiğinde çağrılan fonksiyon
  const handleOverwriteConfirm = async (overwrite: boolean) => {
    setIsOverwriteModalOpen(false); // Modal'ı kapat

    if (overwrite && existingHomepageLaunch) {
      try {
        // Önce eski ana sayfa lansmanını pasif yap
        await api.put(`/launch/${existingHomepageLaunch._id}`, {
          ...existingHomepageLaunch,
          showOnHomepage: false,
        });

        // Yeni lansmanı ana sayfaya kaydet
        await saveLaunch();
      } catch (error) {
        console.error('Lansman güncellenirken bir hata oluştu:', error);
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Lansmanı Düzenle"
        className="bg-white p-8 rounded-lg shadow-lg max-w-6xl w-full mx-auto mt-10"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#192055]">Lansmanı Düzenle</h3>
          <button onClick={onClose} className="text-gray-500 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6 mb-4">
            {/* Sol sütun */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700">Lansman Adı: <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="launchName"
                  value={formData.launchName}
                  onChange={(e) => setFormData({ ...formData, launchName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Firma Adı: <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Firma Logosu: <span className="text-red-500">*</span></label>
                <div
                  className="relative w-full p-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer"
                  onClick={() => setLogoSelectorOpen(true)}
                >
                  <span className="text-gray-500">
                    {formData.companyLogo ? 'Logo Seçildi' : 'Seç'}
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-gray-700">Yayına Giriş Tarihi: <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Yayın Bitiş Tarihi: <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Sağ sütun */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700">Dil: <span className="text-red-500">*</span></label>
                {(() => {
                  const languageOptions = [
                    { value: 'TR', label: 'Türkçe', flagCode: 'TR' },
                    { value: 'EN', label: 'İngilizce', flagCode: 'GB' },
                    { value: 'PT', label: 'Portekizce', flagCode: 'PT' },
                    { value: 'ES', label: 'İspanyolca', flagCode: 'ES' },
                    { value: 'AR', label: 'Arapça', flagCode: 'SA' },
                    { value: 'DE', label: 'Almanca', flagCode: 'DE' },
                    { value: 'FR', label: 'Fransızca', flagCode: 'FR' },
                    { value: 'IT', label: 'İtalyanca', flagCode: 'IT' },
                    { value: 'ZH', label: 'Çince', flagCode: 'CN' },
                    { value: 'JP', label: 'Japonca', flagCode: 'JP' },
                    { value: 'KO', label: 'Korece', flagCode: 'KR' },
                    { value: 'RU', label: 'Rusça', flagCode: 'RU' },
                    { value: 'NL', label: 'Flemenkçe', flagCode: 'NL' },
                    {value:'NO',label:'Norveççe',flagCode:'NO'}
                  ];
                  const selectedOption = languageOptions.find(opt => opt.value === formData.language);
                  return (
                    <Select
                      value={selectedOption || null}
                      onChange={(selected) => setFormData({ ...formData, language: selected?.value || '' })}
                      options={languageOptions}
                      placeholder="Seç"
                      formatOptionLabel={({ flagCode, label, value }: any) => (
                        <div className="flex items-center gap-2">
                          <Flag code={flagCode} style={{ width: '24px', height: '18px' }} />
                          <span>{label}</span>
                          <span className="text-gray-500">({value})</span>
                        </div>
                      )}
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          minHeight: '42px',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          }
                        })
                      }}
                    />
                  );
                })()}
              </div>
              <div>
                <label className="block text-gray-700">
                  Ekosistem Şirketi:
                </label>
                <div
                  className="relative w-full p-3 border border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => setCompanySelectionOpen(true)}
                >
                  {selectedCompany ? (
                    <div className="flex items-center space-x-3">
                      {/* Logo */}
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                        {selectedCompany.logo?.url ? (
                          <img
                            src={selectedCompany.logo.url}
                            alt={selectedCompany.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="40"%3E?%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <span className="text-xl">🏢</span>
                        )}
                      </div>
                      {/* Şirket adı */}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">{selectedCompany.name}</p>
                        <p className="text-xs text-gray-500">Değiştirmek için tıklayın</p>
                      </div>
                      {/* Silme ikonu */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCompany(null);
                          setFormData({
                            ...formData,
                            ecosystemCompanyId: '',
                            companyName: '',
                            companyLogo: ''
                          });
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                        title="Seçimi kaldır"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {/* Sağ ok ikonu */}
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Şirket seçin</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div></div>
              <div>
                <label className="block text-gray-700">Grup Numarası:</label>
                <input
                  type="text"
                  name="groupNumber"
                  value={formData.groupNumber}
                  onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Sıra Numarası:</label>
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {errorMessage && <div className="text-red-600 mb-4">{errorMessage}</div>}

          <div className="flex space-x-4">
            <label className="flex items-center">
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                name="isActive"
                inputProps={{ 'aria-label': 'Aktif Et' }}
                color="primary"
              />
              <span className="ml-2 text-blue-700">Aktif Et</span>
            </label>
            <label className="flex items-center">
              <Switch
                checked={formData.showOnHomepage}
                onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                name="showOnHomepage"
                inputProps={{ 'aria-label': 'Anasayfada Göster' }}
                color="primary"
              />
              <span className="ml-2 text-blue-700">Anasayfa Yap</span>
            </label>
          </div>

          <div className="flex justify-end space-x-4 mt-4">
            <button
              type="button"
              className="bg-red-700 text-white py-2 px-4 rounded"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Lansmanı Sil
            </button>
            <button type="submit" className="bg-[#192055] text-white py-2 px-4 rounded">
              Kaydet
            </button>
          </div>
        </form>

        <ImageSelector
          onSelect={handleLogoSelect}
          onClose={() => setLogoSelectorOpen(false)}
          isOpen={logoSelectorOpen}
          launchFolder={launchId} // Mevcut lansmanın ID'si ile klasörleme
        />
      </Modal>



      {/* Lansman Silme Modalı */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-center"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {formData.isActive
            ? 'Bu Etkinlik aktif durumda. Silmek için önce pasife almalısınız.'
            : 'Etkinliği silmek istediğinize emin misiniz?'}
        </h2>
        <div className="flex justify-end space-x-4">
          {formData.isActive ? (
            // Eğer lansman aktifse "Tamam" butonu
            <button
              type="button"
              className="bg-[#192055] text-white py-2 px-4 rounded"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Tamam
            </button>
          ) : (
            // Eğer pasifse "Evet" ve "Hayır" butonları
            <>
              <button
                type="button"
                className="bg-gray-500 text-white py-2 px-4 rounded"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Hayır
              </button>
              <button
                type="button"
                className="bg-red-700 text-white py-2 px-4 rounded"
                onClick={handleDelete}
              >
                Evet
              </button>
            </>
          )}
        </div>
      </Modal>

      {/* Overwrite Modal */}
      <Modal
        isOpen={isOverwriteModalOpen}
        onRequestClose={() => setIsOverwriteModalOpen(false)}
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-auto z-[9999]" // Yüksek z-index ekle
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex justify-center items-center" // Yüksek z-index ekle
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {existingHomepageLaunch?.launchName} lansmanı şu anda ana sayfada gösteriliyor. Bu lansmanla değiştirmek istiyor musunuz?
        </h2>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded"
            onClick={() => handleOverwriteConfirm(false)}
          >
            Hayır
          </button>
          <button
            type="button"
            className="bg-red-700 text-white py-2 px-4 rounded"
            onClick={() => handleOverwriteConfirm(true)}
          >
            Evet
          </button>
        </div>
      </Modal>
  {/* Company Selection Modal */}
  <CompanySelectionModal
        isOpen={companySelectionOpen}
        onClose={() => setCompanySelectionOpen(false)}
        onSelect={handleCompanySelect}
        selectedCompanyId={selectedCompany?._id}
      />

    </>
  );
};

export default EditLaunchPopup;
