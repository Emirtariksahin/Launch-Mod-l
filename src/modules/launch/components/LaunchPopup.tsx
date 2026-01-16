import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import useLaunchStore, { LaunchData } from '../store/launchStore';
import { api } from '../../../services';
import MediaSelector from './MediaSelector';
import CompanySelector from './CompanySelector';
import { S3File } from '../services/types';
import { Switch } from '@mui/material';
import CompanySelectionModal, { Company } from './CompanySelectionModal';
import Select from 'react-select';
import Flag from 'react-world-flags';
Modal.setAppElement('#root');

const LaunchPopup: React.FC<{ onSave: (newLaunch: LaunchData) => void }> = ({ onSave }) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [companySelectorOpen, setCompanySelectorOpen] = useState(false);
  const { formData, setFormData, resetFormData } = useLaunchStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false);
  const [existingHomepageLaunch, setExistingHomepageLaunch] = useState<LaunchData | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [companySelectionOpen, setCompanySelectionOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [tempLaunchId, setTempLaunchId] = useState<string>('');
  
  const openModal = () => {
    resetFormData();
    // Geçici bir ID oluştur (timestamp + random)
    const generatedTempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setTempLaunchId(generatedTempId);
    setIsOpen(true);
  };

  const closeModal = () => {
    resetFormData();
    setErrorMessage(null);
    setSelectedCompanyName('');
    setTempLaunchId('');
    setIsOpen(false);
  };
  useEffect(() => {
    if (formData.ecosystemCompanyId && !selectedCompany) {
      // Form data'da ID varsa ama selectedCompany yoksa, seçili şirketi belirle
      // (Edit modunda kullanılır)
      setSelectedCompany({
        _id: formData.ecosystemCompanyId,
        name: formData.companyName || 'Seçili Şirket',
        logo: { url: formData.companyLogo || '' }
      });
    }
  }, [formData.ecosystemCompanyId]);
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      ecosystemCompanyId: company._id,
      companyName: company.name,
      companyLogo: company.logo.url
    });
    setCompanySelectionOpen(false);
  };
  // Mevcut ana sayfa lansmanını kontrol etmek için useEffect
  useEffect(() => {
    const fetchHomepageLaunch = async () => {
      try {
        const response = await api.get<LaunchData[]>(`${process.env.REACT_APP_API_URL}/launch`);
        const homepageLaunch = response.data.find(l => l.showOnHomepage);
        setExistingHomepageLaunch(homepageLaunch || null);
      } catch (error) {
        console.error('Ana sayfa lansmanı alınırken bir hata oluştu:', error);
      }
    };
    fetchHomepageLaunch();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMediaSelect = (file: S3File) => {
    setFormData({ companyLogo: file.url });
    setMediaSelectorOpen(false);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.startDate);

    if (!formData.companyLogo) {
      setErrorMessage('Firma logosu zorunludur.');
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      setErrorMessage('Bitiş tarihi, yayına giriş tarihinden önce olamaz.');
      return;
    }


    // Eğer showOnHomepage true ise, mevcut ana sayfa lansmanını kontrol et
    if (formData.showOnHomepage && existingHomepageLaunch) {
      setIsOverwriteModalOpen(true);
      return;
    }

    await saveLaunch();
  };

  const saveLaunch = async () => {
    try {
      // Geçici ID'yi formData'ya ekle
      const dataToSend = {
        ...formData,
        tempLaunchId: tempLaunchId // Backend'de medya klasörünü eşleştirmek için
      };
      
      const response = await api.post<LaunchData>('/launch', dataToSend);

      if (response.status === 201) {
        const newLaunch: LaunchData = response.data;
        onSave(newLaunch);
        closeModal();
      } else {
        console.error('Veriler kaydedilirken bir hata oluştu:', response.statusText);
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        console.error('Veriler kaydedilirken bir hata oluştu:', error.response?.data || error.message);
        setErrorMessage('Veriler kaydedilirken bir hata oluştu.');
      }
    }
  };

  // Overwrite onayı
  const handleOverwriteConfirm = async (overwrite: boolean) => {
    if (overwrite && existingHomepageLaunch) {
      try {
        // Önce mevcut lansmanı pasif yapalım
        await api.put(`/launch/${existingHomepageLaunch._id}`, { showOnHomepage: false });

        // Yeni lansmanı kaydet
        await saveLaunch();
      } catch (error) {
        console.error('Lansman güncellenirken bir hata oluştu:', error);
      }
    } else {
      // Kullanıcı "Hayır" dediğinde, "Anasayfa Yap" seçeneğini devre dışı bırak
      setFormData({
        ...formData,
        showOnHomepage: false,
      });
    }
    setIsOverwriteModalOpen(false);
  };

  return (
    <div>
      <button
        onClick={openModal}
        className="bg-white text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow hover:bg-gray-100"
      >
        Yeni Ekle
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Yeni Lansman Ekle"
        className="bg-white p-8 rounded-lg shadow-lg max-w-6xl w-full mx-auto mt-10"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[500] flex justify-center items-center"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-[#192055]">Yeni Lansman Ekle</h3>
          <button onClick={closeModal} className="text-gray-500 text-xl">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-6 mb-4">
            {/* Sol sütun */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700">
                  Lansman Adı: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="launchName"
                  value={formData.launchName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Input"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  Firma Adı: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Input"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  Firma Logosu: <span className="text-red-500">*</span>
                </label>
                <div
                  className="relative w-full p-2 border border-gray-300 rounded flex items-center justify-between cursor-pointer"
                  onClick={() => setMediaSelectorOpen(true)}
                >
                  <span className="text-gray-500">
                    {formData.companyLogo ? 'Logo Seçildi' : 'Seç'}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <div>
                <label className="block text-gray-700">
                  Yayına Giriş Tarihi: <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  Yayın Bitiş Tarihi: <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    name="isActive"
                    inputProps={{ 'aria-label': 'Aktif Et' }}
                    color="primary"
                  />
                  <span className="ml-2 text-blue-700">Aktif Et</span>
                </label>
                <label className="flex items-center">
                  <Switch
                    checked={formData.showOnHomepage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        showOnHomepage: e.target.checked,
                      })
                    }
                    name="showOnHomepage"
                    inputProps={{ 'aria-label': 'Anasayfada Göster' }}
                    color="primary"
                  />
                  <span className="ml-2 text-blue-700">Anasayfa Yap</span>
                </label>
              </div>
            </div>
            {/* Sağ sütun */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700">
                  Dil: <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-gray-700">Grup Numarası:</label>
                <input
                  type="text"
                  name="groupNumber"
                  value={formData.groupNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Input"
                />
              </div>
              <div>
                <label className="block text-gray-700">Sıra Numarası:</label>
                <input
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Input"
                />
              </div>
              <label className="block text-gray-700">Ekosistem Firma Seç:</label>
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
          </div>
          {errorMessage && <div className="text-red-600 mb-4">{errorMessage}</div>}
          <div className="flex justify-end">
            <button type="submit" className="bg-[#192055] text-white py-2 px-4 rounded">
              Kaydet
            </button>
          </div>
        </form>
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

      {/* Media Selector Popup */}
      <Modal
        isOpen={mediaSelectorOpen}
        onRequestClose={() => setMediaSelectorOpen(false)}
        contentLabel="Medya Seç"
        className="bg-white p-4 rounded-lg shadow-lg max-w-[500px] w-full mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex justify-center items-center"  // Z-index düzeltmesi burada
      >
        <MediaSelector 
          onSelect={handleMediaSelect} 
          onClose={() => setMediaSelectorOpen(false)} 
          isOpen={true}
          launchFolder={tempLaunchId} // Geçici ID ile klasörleme
        />
      </Modal>
      {/* Company Selection Modal */}
      <CompanySelectionModal
        isOpen={companySelectionOpen}
        onClose={() => setCompanySelectionOpen(false)}
        onSelect={handleCompanySelect}
        selectedCompanyId={selectedCompany?._id}
      />
    </div>
  );
};

export default LaunchPopup;
