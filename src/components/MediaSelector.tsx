// src/components/ImageSelector.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/apiService';
import { S3File } from '../services/types';
import NewMediaPopup from './NewMediaPopup';

interface ImageSelectorProps {
  onSelect: (file: S3File) => void;
  onClose: () => void;
  isOpen: boolean;
  launchFolder?: string | null;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ onSelect, onClose, isOpen, launchFolder: launchFolderProp }) => {
  const { id: routeLaunchId } = useParams<{ id: string }>();
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [launchFolder, setLaunchFolder] = useState<string | null>(null);
  const [launchName, setLaunchName] = useState<string | null>(null);
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

  // Çoklu seçim modu
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<S3File[]>([]);

  const filteredFiles = files.filter(file =>
    file.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- 1) Dosyaları önceden yükleyelim ---
  const fetchFiles = async (activeId?: string | null) => {
    setLoading(true);
    try {
      const effectiveId = activeId ?? launchFolderProp ?? routeLaunchId ?? null;
      // Eğer showAllMedia açık değilse ve etkin ID yoksa tüm S3'ü çekmeyelim
      if (!showAllMedia && !effectiveId) {
        setFiles([]);
        setError(null);
        return;
      }

      const url = showAllMedia
        ? '/s3files'
        : `${process.env.REACT_APP_API_URL}/media/media/by-launch/${effectiveId}`;
      const res = await api.get<S3File[]>(url);
      setFiles(res.data);
      setError(null);
    } catch {
      setError('Veriler getirilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Mount olurken ve launchId ya da showAllMedia değişince fetch
  useEffect(() => {
    // Öncelik: prop ile gelen launchFolder, yoksa route paramı
    const id = launchFolderProp ?? routeLaunchId ?? null;
    setLaunchFolder(id);
    fetchFiles(id);
  }, [launchFolderProp, routeLaunchId, showAllMedia]);

  // --- 2) Etkinlik adını önceden çekelim ---
  useEffect(() => {
    const activeId = launchFolderProp ?? routeLaunchId;
    // Eğer launchFolder null ise (örneğin announcement için), event kontrolü yapma
    if (!activeId || launchFolderProp === null) return;
    // Önce launch olarak dene; başarısız olursa etkinlikten name.tr getir
    api.get<{ launchName: string }>(`${process.env.REACT_APP_API_URL}/launch/${activeId}`)
      .then(r => {
        if (r.data?.launchName) setLaunchName(r.data.launchName);
      })
      .catch(async () => {
        // launchFolderProp null ise event kontrolü yapma (announcement gibi durumlar için)
        if (launchFolderProp === null) return;
        try {
          const er = await api.get<{ name: { tr: string } }>(`${process.env.REACT_APP_API_URL}/event/event-role-id/${activeId}`);
          if ((er.data as any)?.name?.tr) setLaunchName((er.data as any).name.tr);
        } catch {
          // isim alınamadı; sessiz geç
        }
      });
  }, [launchFolderProp, routeLaunchId]);

  const renderFilePreview = (file: S3File) => {
    const ext = file.url.split('?')[0].split('.').pop()?.toLowerCase();
    if (['jpg','jpeg','png','gif','webp','avif'].includes(ext||'')) {
      return <img src={file.url} alt={file.key} className="w-full h-full object-cover mb-2" />;
    }
    if (['mp4','webm','ogg'].includes(ext||'')) {
      return <video src={file.url} className="w-full h-full object-cover mb-2" controls />;
    }
    if (ext === 'pdf') {
      return <iframe src={file.url} title={file.key} className="w-full h-[120px] border mb-2" />;
    }
    return <p className="text-xs text-center">{file.key}</p>;
  };

  const handleUploadComplete = () => {
    setIsUploadPopupOpen(false);
    // Mevcut launchFolder state'ini kullanarak listeyi güncelle
    const currentId = launchFolderProp ?? routeLaunchId ?? null;
    fetchFiles(currentId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Başlık */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Medya Seç {launchName && !showAllMedia && (
              <span className="text-sm text-gray-500">/ {launchName}</span>
            )}
          </h3>
          <button onClick={onClose} className="text-gray-500 text-xl">&times;</button>
        </div>

        {/* Arama + Butonlar */}
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md"
          />

         

          <button
            onClick={() => setIsUploadPopupOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
          >
            Yeni Medya Ekle
          </button>

          <button
            onClick={() => {
              setMultiSelectEnabled(m => !m);
              setSelectedFiles([]);
            }}
            className={`px-4 py-2 rounded ${
              multiSelectEnabled ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            {multiSelectEnabled ? 'Çoklu Mod (Açık)' : 'Çoklu Mod (Kapalı)'}
          </button>

          {multiSelectEnabled && (
            <>
              <button
                onClick={() => {
                  selectedFiles.forEach(f => onSelect(f));
                  onClose();
                }}
                disabled={selectedFiles.length === 0}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                Seçimi Onayla ({selectedFiles.length})
              </button>
              <button
                onClick={() => setSelectedFiles([])}
                disabled={selectedFiles.length === 0}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Seçimi Kaldır
              </button>
            </>
          )}
        </div>

        {/* Medya Izgarası */}
        <div className="overflow-y-auto">
          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {filteredFiles.map((file, idx) => {
                const isSel = selectedFiles.some(f => f.key === file.key);
                return (
                  <div
                    key={idx}
                    style={{ width: '150px', height: '150px' }}
                    className={`p-2 cursor-pointer flex flex-col items-center ${
                      isSel ? 'border-4 border-yellow-500' : 'border'
                    }`}
                    onClick={() => {
                      if (multiSelectEnabled) {
                        setSelectedFiles(prev =>
                          prev.some(f => f.key === file.key)
                            ? prev.filter(f => f.key !== file.key)
                            : [...prev, file]
                        );
                      } else {
                        onSelect(file);
                        onClose();
                      }
                    }}
                  >
                    {renderFilePreview(file)}
                    <p className="text-xs text-center truncate">
                      {decodeURIComponent(file.key.split('/').pop() || '')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Yeni Medya Popup */}
      <NewMediaPopup
        isOpen={isUploadPopupOpen}
        onClose={handleUploadComplete}
        launchFolder={launchFolder || routeLaunchId}
      />
    </div>
  );
};

export default ImageSelector;
