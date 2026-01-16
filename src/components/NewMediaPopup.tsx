import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { MdFileDownload, MdDelete } from "react-icons/md";
import axios from 'axios';
import Cookies from 'js-cookie';

Modal.setAppElement('#root');

interface NewMediaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  launchFolder?: string | null;
}

const NewMediaPopup: React.FC<NewMediaPopupProps> = ({ isOpen, onClose, launchFolder }) => {
  const [mediaName, setMediaName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false); // 🔄 Yeni state

  useEffect(() => {
    if (isOpen) {
      setMediaName('');
      setSelectedFiles([]);
      setFilePreviews([]);
      setLoading(false);
      setDragActive(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setFilePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    }
  };

  const handleDelete = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setFilePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...filesArray]);
      const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
      setFilePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSave = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);

    try {
      const token = Cookies.get('adminToken');

      for (let file of selectedFiles) {
        const formData = new FormData();
        formData.append('mediaName', mediaName);
        formData.append('file', file);

        if (launchFolder) {
          formData.append('launchId', launchFolder);
        }

        await axios.post(`${process.env.REACT_APP_API_URL}/media`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      onClose();
    } catch (error) {
      console.error('Dosya yüklenirken bir hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Yeni Medya Ekle"
      className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex justify-center items-center"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#192055]">Yeni Medya Ekle</h3>
        <button onClick={onClose} className="text-gray-500 text-xl">&times;</button>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Medya/Grup Adı</label>
        <input
          type="text"
          placeholder="Medya/Grup Adı"
          className="border border-gray-300 rounded p-2 w-full"
          value={mediaName}
          onChange={(e) => setMediaName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Tekli/Çoklu Medya Yükle</label>
        <div
          className={`border-2 border-dashed mt-2 p-4 rounded transition-colors duration-200 ${
            dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="flex items-center justify-center bg-gray-500 text-white py-2 px-4 rounded cursor-pointer"
          >
            <MdFileDownload className="mr-2" />
            Dosya Seç veya buraya sürükleyin
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {filePreviews.map((preview, index) => (
          <div key={index} className="w-24 h-24 border border-gray-300 rounded overflow-hidden relative">
            {selectedFiles[index].type.startsWith('image/') ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : selectedFiles[index].type.startsWith('video/') ? (
              <video src={preview} className="w-full h-full object-cover" controls />
            ) : (
              <span>Desteklenmeyen format</span>
            )}
            <button
              onClick={() => handleDelete(index)}
              className="absolute top-1 right-1 text-red-500 bg-white rounded-full p-1"
            >
              <MdDelete />
            </button>
          </div>
        ))}
      </div>

      {loading && (
        <p className="text-red-700 mb-4">Yükleniyor...</p>
      )}

      <button
        onClick={handleSave}
        className="bg-red-700 text-white py-2 px-4 rounded"
        disabled={loading}
      >
        {loading ? 'Yükleniyor...' : 'Kaydet'}
      </button>
    </Modal>
  );
};

export default NewMediaPopup;
