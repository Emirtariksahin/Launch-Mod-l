import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services';
import { LaunchPopup, EditLaunchPopup } from '../components';
import { LaunchData } from '../store/launchStore';
import { GrSearch } from "react-icons/gr";
import { FcOk } from "react-icons/fc";
import CancelIcon from '@mui/icons-material/Cancel';
import { pink } from '@mui/material/colors';
import { FaRegEdit } from "react-icons/fa";
import { MdOutlinePalette } from "react-icons/md";
import { FaGlobe } from 'react-icons/fa'; // Dil simgesi
import { BsChevronDown, BsChevronUp } from 'react-icons/bs'; // Aşağı ve yukarı ok ikonları
import { Sidebar, Header } from '../../../components';
import Cookies from 'js-cookie';

const LaunchListPage: React.FC = () => {
  const [launches, setLaunches] = useState<LaunchData[]>([]);
  const [filteredLaunches, setFilteredLaunches] = useState<LaunchData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editPopupOpen, setEditPopupOpen] = useState(false);
  const [currentLaunchId, setCurrentLaunchId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'TR' | 'EN'>('all');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false); // Menünün açık olup olmadığını kontrol etmek için state

  // Buton açılış-kapanış durumlarını takip eden state
  const [isTodayLaunchesOpen, setIsTodayLaunchesOpen] = useState(false);
  const [isPastLaunchesOpen, setIsPastLaunchesOpen] = useState(false);
  const [isUpcomingLaunchesOpen, setIsUpcomingLaunchesOpen] = useState(false);
  const [isActiveLaunchesOpen, setIsActiveLaunchesOpen] = useState(false);
  const [isInactiveLaunchesOpen, setIsInactiveLaunchesOpen] = useState(false);
  const [isAllLaunchesOpen, setIsAllLaunchesOpen] = useState(false);

  const navigate = useNavigate();
  const handleSwitchChange = async (id: string, currentValue: boolean) => {
    try {
      // Yeni değeri tersine çevir
      const updatedValue = !currentValue;

      // Sunucuya güncelleme isteği gönder
      const response = await api.put(`${process.env.REACT_APP_API_URL}/launch/${id}`, {
        showOnVisitform: updatedValue,
      });

      // Lansmanlar listesini güncelle
      setLaunches((prevLaunches) =>
        prevLaunches.map((launch) =>
          launch._id === id ? { ...launch, showOnVisitform: updatedValue } : launch
        )
      );

      // Filtrelenmiş lansmanlar listesini de güncelle
      setFilteredLaunches((prevLaunches) =>
        prevLaunches.map((launch) =>
          launch._id === id ? { ...launch, showOnVisitform: updatedValue } : launch
        )
      );
    } catch (error) {
      console.error('showOnVisitform güncellenirken bir hata oluştu:', error);
    }
  };

  useEffect(() => {
    const fetchLaunches = async () => {
      try {
        const response = await api.get<LaunchData[]>(`${process.env.REACT_APP_API_URL}/launch`);
        const updatedLaunches = response.data.map((launch) => {
          // Tarihi kontrol edip pasif durumu değiştirme işlemi kaldırıldı.
          return launch;
        });
  
        setLaunches(updatedLaunches);
        setFilteredLaunches(updatedLaunches);
      } catch (error) {
        console.error('Etkinlikler getirilirken bir hata oluştu:', error);
      }
    };
  
    fetchLaunches();
  }, []);
  
  useEffect(() => {
    const filtered = launches.filter((launch) =>
      launch.launchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      launch.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      launch.orderNumber.toString().includes(searchQuery)
    );
    setFilteredLaunches(filtered);
  }, [searchQuery, launches]);

  const getDaysUntilLaunch = (startDate: string): number => {
    const today = new Date();
    const start = new Date(startDate);
    const timeDifference = start.getTime() - today.getTime();
    const daysUntilLaunch = Math.ceil(timeDifference / (1000 * 3600 * 24));
    return daysUntilLaunch;
  };

  const getLanguageCode = (language: string) => {
    if (language.toLowerCase() === 'türkçe' || language.toLowerCase() === 'turkish') return 'TR';
    if (language.toLowerCase() === 'i̇ngilizce' || language.toLowerCase() === 'english') return 'EN';
    return language;
  };

  const getRowStyle = (startDate: string, endDate: string, isActive: boolean): string => {
    const daysUntilLaunch = getDaysUntilLaunch(startDate);
    const today = new Date();
    const start = new Date(startDate);

    if (start.toDateString() === today.toDateString()) {
      return 'bg-white-100';
    } else if (daysUntilLaunch <= 7 && daysUntilLaunch >= 0) {
      return 'bg-white-200';
    }

    return '';
  };

  const handleEdit = (id: string) => {
    setCurrentLaunchId(id);
    setEditPopupOpen(true);
  };

  const handleSave = (updatedLaunch: LaunchData) => {
    setLaunches(prevLaunches =>
      prevLaunches.map(launch =>
        launch._id === updatedLaunch._id ? updatedLaunch : launch
      )
    );
    setFilteredLaunches(prevLaunches =>
      prevLaunches.map(launch =>
        launch._id === updatedLaunch._id ? updatedLaunch : launch
      )
    );
    setEditPopupOpen(false);
  };

  const handleAdd = (newLaunch: LaunchData) => {
    setLaunches(prevLaunches => [newLaunch, ...prevLaunches]);
    setFilteredLaunches(prevLaunches => [newLaunch, ...prevLaunches]);
  };

  const handleDelete = (deletedLaunchId: string) => {
    setLaunches(prevLaunches =>
      prevLaunches.filter(launch => launch._id !== deletedLaunchId)
    );
    setFilteredLaunches(prevLaunches =>
      prevLaunches.filter(launch => launch._id !== deletedLaunchId)
    );
  };

  const handleDesign = (id: string) => {
    navigate(`/admin-panel/design/${id}`);
  };

  const handleSortByDate = () => {
    const sortedLaunches = [...filteredLaunches].sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();

      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setFilteredLaunches(sortedLaunches);
  };

  // Dil seçimine göre filtreleme
  const filterByLanguage = (language: 'TR' | 'EN' | 'all') => {
    setSelectedLanguage(language);
    setIsLanguageMenuOpen(false); // Dil seçimi yapıldığında menüyü kapat
    if (language === 'all') {
      setFilteredLaunches(launches);
    } else {
      const filtered = launches.filter(launch => getLanguageCode(launch.language) === language);
      setFilteredLaunches(filtered);
    }
  };

  const toggleState = (setter: React.Dispatch<React.SetStateAction<boolean>>, currentValue: boolean) => {
    setter(!currentValue); // Mevcut durumu tersine çevirir
  };

  const filterTodayLaunches = () => {
    const today = new Date().toDateString();
    const filtered = launches.filter(launch => new Date(launch.startDate).toDateString() === today);
    setFilteredLaunches(filtered);
    toggleState(setIsTodayLaunchesOpen, isTodayLaunchesOpen);
  };

  const filterPastLaunches = () => {
    const today = new Date();
    const filtered = launches.filter(launch => new Date(launch.endDate) < today);
    setFilteredLaunches(filtered);
    toggleState(setIsPastLaunchesOpen, isPastLaunchesOpen);
  };

  const filterUpcomingLaunches = () => {
    const today = new Date();
    const filtered = launches.filter(launch => new Date(launch.startDate) > today);
    setFilteredLaunches(filtered);
    toggleState(setIsUpcomingLaunchesOpen, isUpcomingLaunchesOpen);
  };
  

  const filterActiveLaunches = () => {
    const filtered = launches.filter(launch => launch.isActive);
    setFilteredLaunches(filtered);
    toggleState(setIsActiveLaunchesOpen, isActiveLaunchesOpen);
  };

  const filterInactiveLaunches = () => {
    const filtered = launches.filter(launch => !launch.isActive);
    setFilteredLaunches(filtered);
    toggleState(setIsInactiveLaunchesOpen, isInactiveLaunchesOpen);
  };

  const showAllLaunches = () => {
    setFilteredLaunches(launches);
    toggleState(setIsAllLaunchesOpen, isAllLaunchesOpen);
  };



  const [currentPage, setCurrentPage] = useState(1);
  const launchesPerPage = 10;

  // Get current launches
  const indexOfLastLaunch = currentPage * launchesPerPage;
  const indexOfFirstLaunch = indexOfLastLaunch - launchesPerPage;
  const currentLaunches = filteredLaunches.slice(indexOfFirstLaunch, indexOfLastLaunch);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white z-50">
        <Sidebar /> {/* Sidebar component goes here */}
      </div>

      {/* Main Content */}
      <div className="ml-64 w-full">
        {/* Top Navbar */}
        <div className="fixed top-0 w-full h-16 bg-white shadow z-40">
          <Header /> {/* Header component goes here */}
        </div>

        {/* Page Content */}
        <div className="pt-24 pl-8 pr-8 pb-8">
          {/* Search and Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col space-y-2 w-full max-w-3xl">
              <h2 className="text-4xl font-semibold mb-6">Lansmanlar</h2>  {/* Başlığın altına boşluk ekledik */}

              <div className="flex items-center border border-gray-300 rounded overflow-hidden w-full">
                <div className="p-2 bg-white">
                  <GrSearch className="text-gray-800 text-2xl" /> {/* İkonun boyutunu ve rengini artırdık */}
                </div>
                <input
                  type="text"
                  placeholder="Lansman adı veya firma adı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 flex-grow outline-none"
                />
              </div>
              <p className="mt-2 text-lg font-semibold">
                <span className="text-gray-500">Toplam Lansman: {launches.length}</span>
                <span className="mx-4">|</span> {/* Dikey çizgi ekledik ve kenarlara boşluk verdik */}
                <span>Aktif: {launches.filter(launch => launch.isActive).length}</span>
                <span className="mx-4">|</span>
                <span>Pasif: {launches.filter(launch => !launch.isActive).length}</span>
              </p>
            </div>

            {/* Yeni Ekle Button */}
            <div className="flex items-center space-x-4 ml-4 mt-2">
              <div className="relative">
                <button
                  className="p-2 rounded bg-transparent hover:bg-transparent"
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)} // Toggle menu
                >
                  <FaGlobe className="text-gray-600 text-2xl ml-10" /> {/* İkonu sağa daha fazla kaydırdık */}
                </button>
                {isLanguageMenuOpen && (
                  <div className="absolute left-0 mt-2 py-2 w-32 bg-white rounded-lg shadow-xl">
                    <button
                      className={`block w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 ${selectedLanguage === 'TR' ? 'font-bold' : ''}`}
                      onClick={() => filterByLanguage('TR')}
                    >
                      🇹🇷 Türkçe
                    </button>
                    <button
                      className={`block w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 ${selectedLanguage === 'EN' ? 'font-bold' : ''}`}
                      onClick={() => filterByLanguage('EN')}
                    >
                      🇬🇧 İngilizce
                    </button>
                    <button
                      className={`block w-full px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-100 ${selectedLanguage === 'all' ? 'font-bold' : ''}`}
                      onClick={() => filterByLanguage('all')}
                    >
                      🌍 Tümü
                    </button>
                  </div>
                )}
              </div>
              <LaunchPopup onSave={handleAdd} />
            </div>
          </div>

          <div className="flex justify-start space-x-4 mt-6 mb-8">
            {/* İlk satırdaki butonlar */}
            <button
              onClick={filterActiveLaunches}
              className={`px-6 py-3 font-semibold rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-gray-800 bg-transparent border border-gray-400 shadow-lg`}
            >
              Aktif Lansmanlar
            </button>
            <button
              onClick={filterInactiveLaunches}
              className={`px-6 py-3 font-semibold rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-gray-800 bg-transparent border border-gray-400 shadow-lg`}
            >
              Pasif Lansmanlar
            </button>
          </div>

          {/*  alt satır buttonlar aldık */}
          <div className="flex justify-start space-x-4 mt-4 mb-8">
            <button
              onClick={filterTodayLaunches}
              className={`px-6 py-3 font-semibold rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-gray-800 bg-transparent border border-gray-400 shadow-lg`}
            >
              Bugünün Lansmanları
            </button>

            <button
              onClick={filterPastLaunches}
              className={`px-6 py-3 font-semibold rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-gray-800 bg-transparent border border-gray-400 shadow-lg`}
            >
              Geçmiş Lansmanlar
            </button>
            <button
              onClick={filterUpcomingLaunches}
              className={`px-6 py-3 font-semibold rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-gray-800 bg-transparent border border-gray-400 shadow-lg`}
            >
              Gelecek Lansmanlar
            </button>
            <button
              onClick={showAllLaunches}
              className={`px-6 py-3 font-semibold rounded-full transition duration-300 ease-in-out transform hover:scale-105 text-gray-800 bg-transparent border border-gray-400 shadow-lg`}
            >
              Tüm Lansmanlar
            </button>
          </div>

          {/* Launch List Table */}
          <div className="overflow-x-auto shadow-sm border rounded-lg">
            <table className="min-w-full text-left table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-left">Lansman Adı</th>
                  <th className="px-4 py-2 text-left">Firma Adı</th>
                  <th className="px-4 py-2 text-center">Dil</th>
                  <th className="px-4 py-2 text-center">Sıra No</th>
                  <th className="px-4 py-2 text-center">Grup No</th>
                  <th className="px-4 py-2 text-center cursor-pointer" onClick={handleSortByDate}>
                    Yayına Giriş Tarihi {sortOrder === 'asc' ? '▲' : '▼'}
                  </th>
                  <th className="px-4 py-2 text-center">Yayın Bitiş Tarihi</th>
                  <th className="px-4 py-2 text-center">Durumu</th>
                  <th className="px-4 py-2 text-center">Ziyaretçi Formu Görünsün</th>
                  <th className="px-4 py-2 text-center"></th>
                  <th className="px-4 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {currentLaunches.map((launch: LaunchData, index: number) => (
                  <tr
                    key={index}
                    className={`border-b ${getRowStyle(launch.startDate.toString(), launch.endDate.toString(), launch.isActive)} ${launch.showOnHomepage ? 'shadow-lg bg-gray-300' : ''}`}
                  >
                    <td className="px-4 py-2 text-center">{indexOfFirstLaunch + index + 1}</td>
                    <td className="px-4 py-2 text-left">{launch.launchName}</td>
                    <td className="px-4 py-2 text-left">{launch.companyName}</td>
                    <td className="px-4 py-2 text-center">{getLanguageCode(launch.language)}</td>
                    <td className="px-4 py-2 text-center">{launch.orderNumber}</td>
                    <td className="px-4 py-2 text-center">{launch.groupNumber}</td>
                    <td className="px-4 py-2 text-center">{new Date(launch.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-center">{new Date(launch.endDate).toLocaleDateString()}</td>
                    <td className="px-8 py-2 text-center">
                      {launch.isActive ? (
                        <span className="inline-flex items-center">
                          <FcOk style={{ fontSize: '1.5rem', marginRight: '0.25rem' }} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center">
                          <CancelIcon sx={{ color: pink[500], fontSize: '1.5rem', marginRight: '0.25rem' }} /> Pasif
                        </span>
                      )}
                    </td>

                    {/* Yeni eklenen switch */}
                    <td className="px-4 py-2 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5"
                          checked={launch.showOnVisitform || false}  // Değer undefined ise false olacak şekilde ayarla
                          onChange={() => handleSwitchChange(launch._id, launch.showOnVisitform)}
                        />
                        <span className="ml-2">{launch.showOnVisitform ? 'Evet' : 'Hayır'}</span>
                      </label>
                    </td>

                    <td className="px-4 py-2 text-center cursor-pointer" onClick={() => handleEdit(launch._id)}>
                      <div className="flex items-center space-x-2 text-red-500">
                        <FaRegEdit style={{ fontSize: '1.5rem' }} />
                        <span>Düzenle</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center cursor-pointer" onClick={() => handleDesign(launch._id)}>
                      <div className="flex items-center space-x-2 text-red-500">
                        <MdOutlinePalette style={{ fontSize: '1.5rem' }} />
                        <span>Tasarla</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <nav>
              <ul className="flex list-none">
                {Array.from({ length: Math.ceil(filteredLaunches.length / launchesPerPage) }, (_, index) => (
                  <li key={index} className="mx-1">
                    <button
                      onClick={() => paginate(index + 1)}
                      className={`px-4 py-2 rounded ${currentPage === index + 1 ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border border-gray-300'}`}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {currentLaunchId && (
            <EditLaunchPopup
              launchId={currentLaunchId}
              isOpen={editPopupOpen}
              onClose={() => setEditPopupOpen(false)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
export default LaunchListPage;