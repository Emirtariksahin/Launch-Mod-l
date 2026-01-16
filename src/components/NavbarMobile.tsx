import React from "react";
import { FaBars, FaTimes } from "react-icons/fa"; // FaBars eklendi
// @ts-ignore
import Flag from "react-world-flags";
import { useLocation, useNavigate } from "react-router-dom";

interface NavbarMobileProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  language:string;
  currentMenu: {
    home: string;
    launches: string;
    currentLaunches: string;
    upcomingLaunches: string;
    pastLaunches: string;
    login: string;
    logout: string;
  };
  handleLanguageChange: (lang: "TR" | "EN") => void;
  isOpen: boolean;
  toggleDropdown: () => void;
}

const NavbarMobile: React.FC<NavbarMobileProps> = ({
  menuOpen,
  setMenuOpen,
  language,
  currentMenu,
  handleLanguageChange,
  isOpen,
  toggleDropdown,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Hamburger Butonu - sadece menü kapalıyken göster */}
      {!menuOpen && (
        <div className="sm:hidden fixed top-6 right-4 z-[999]">
          <button
            onClick={() => setMenuOpen(true)}
            className="text-gray-700"
          >
            <FaBars size={24} />
          </button>
        </div>
      )}

      {/* Mobil Menü - menü açıkken göster */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 w-full h-screen bg-white z-[999] shadow-lg flex flex-col items-center space-y-4 p-6 overflow-y-auto">
          {/* Menü Kapatma Butonu */}
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 text-gray-700"
          >
            <FaTimes size={24} />
          </button>

          {/* Menü İçeriği */}
          <button
            onClick={() => navigate(language === "TR" ? "/tr" : "/en")}
            className="w-full text-center px-4 py-3 text-gray-700 hover:bg-gray-100"
          >
            {currentMenu.home}
          </button>
          <button
            onClick={() =>
              navigate(
                language === "TR"
                  ? "/tr/yayindaki-dijital-vitrinler"
                  : "/en/ongoing-digital-events"
              )
            }
            className="w-full text-center px-4 py-3 text-gray-700 hover:bg-gray-100"
          >
            {currentMenu.currentLaunches}
          </button>
          <button
            onClick={() =>
              navigate(
                language === "TR"
                  ? "/tr/gelecek-dijital-vitrinler"
                  : "/en/upcoming-digital-events"
              )
            }
            className="w-full text-center px-4 py-3 text-gray-700 hover:bg-gray-100"
          >
            {currentMenu.upcomingLaunches}
          </button>
          <button
            onClick={() =>
              navigate(
                language === "TR"
                  ? "/tr/gecmis-dijital-vitrinler"
                  : "/en/past-digital-events"
              )
            }
            className="w-full text-center px-4 py-3 text-gray-700 hover:bg-gray-100"
          >
            {currentMenu.pastLaunches}
          </button>
          <button
            onClick={() =>
              navigate(
                `/${language === "TR" ? "tr/giris-yap" : "en/login"}`,
                { state: { from: location.pathname } }
              )
            }
            className="w-full text-center px-4 py-3 text-gray-700 hover:bg-gray-100"
          >
            {currentMenu.login}
          </button>

          {/* Mobil Dil Menüsü */}
          <div className="relative mt-4">
            <button
              onClick={toggleDropdown}
              className="flex items-center px-4 py-2 border rounded-full text-gray-800 hover:text-red-800"
            >
              <Flag code={language === "TR" ? "TUR" : "GBR"} className="mr-2 w-6" />
              <span className="notranslate">{language}</span>
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-lg shadow-lg">
                <button
                  onClick={() => handleLanguageChange("TR")}
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700"
                >
                  <Flag code="TUR" className="mr-2 w-6" />
                  <span>Türkçe</span>
                </button>
                <button
                  onClick={() => handleLanguageChange("EN")}
                  className="flex items-center w-full px-4 py-2 hover:bg-gray-100 text-gray-700"
                >
                  <Flag code="GBR" className="mr-2 w-6" />
                  <span>English</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarMobile;
