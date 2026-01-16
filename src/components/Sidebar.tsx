import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { IoFileTrayOutline } from "react-icons/io5";

const Sidebar: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-white p-8 border-r border-gray-200 z-30">
      {/* DAMISE yazısının altındaki boşluğu artırdık */}
      <div className="text-5xl font-bold text-red-700 mb-5">DAMISE</div>

      {/* Ekstra boşluk */}
      <div className="h-12"></div>

      <div className="flex flex-col space-y-4">
        <Link to="/admin-panel/adminhomepage" className="flex items-center justify-between text-gray-800 hover:text-black py-2">
          <div className="flex items-center space-x-2">
            <IoFileTrayOutline size={24} />
            <span>Ana Sayfa</span>
          </div>
          <FaChevronRight size={16} />
        </Link>
        <Link to="/admin-panel/launch-list" className="flex items-center justify-between text-gray-800 hover:text-black py-2">
          <div className="flex items-center space-x-2">
            <IoFileTrayOutline size={24} />
            <span>Lansman Ekle/Düzelt</span>
          </div>
          <FaChevronRight size={16} />
        </Link>
        <Link to="/admin-panel/gallery-list" className="flex items-center justify-between text-gray-800 hover:text-black py-2">
          <div className="flex items-center space-x-2">
            <IoFileTrayOutline size={24} />
            <span>Galeri Listesi</span>
          </div>
          <FaChevronRight size={16} />
        </Link>
        <Link to="/admin-panel/reports" className="flex items-center justify-between text-gray-800 hover:text-black py-2">
          <div className="flex items-center space-x-2">
            <IoFileTrayOutline size={24} />
            <span>Lansman Raporları</span>
          </div>
          <FaChevronRight size={16} />
        </Link>
        <Link to="/admin-panel/assistant-view-reports" className="flex items-center justify-between text-gray-800 hover:text-black py-2">
          <div className="flex items-center space-x-2">
            <IoFileTrayOutline size={24} />
            <span>Asistan İzlenme Raporları</span>
          </div>
          <FaChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;