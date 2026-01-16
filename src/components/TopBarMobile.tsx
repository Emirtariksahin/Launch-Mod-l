import React, { useEffect, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Flag from "react-world-flags";
import { languageTable } from "../utils/languages";
import { useNavigate } from "react-router-dom";
interface Props {
  language: keyof typeof languageTable;
  links: { label: string, href: string }[];
  handleLanguageChange: (lang: keyof typeof languageTable) => void;
  handleLogout: () => void;
}

const TopBarMobile: React.FC<Props> = ({
  language,
  links,
  handleLanguageChange,
  handleLogout,
}) => {
  const [availableLanguages, setAvailableLanguages] = useState<(keyof typeof languageTable)[] | null>(null); // Varsayılan: null (tüm diller)
  const navigate = useNavigate();
  const [visitorId, setVisitorId] = useState<string | null>(null);
  useEffect(() => {
    // localeStorage'dan visitorId'yi al ve kontrol et
    const storedVisitorId = localStorage.getItem("visitorId");
    setVisitorId(storedVisitorId); // visitorId varsa state'e aktar
  }, []);
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const currentMenu = languageTable[language];
  const displayLabels = {
    TR: {
      launches: "Dijital Etkinlikler",
      currentLaunches: "Yayındaki Etkinlikler",
      upcomingLaunches: "Gelecek Etkinlikler",
      pastLaunches: "Geçmiş Etkinlikler",
    },
    EN: {
      launches: "Events",
      currentLaunches: "Ongoing Events",
      upcomingLaunches: "Upcoming Events",
      pastLaunches: "Past Events",
    }
  }[language];

  return (
    <div className="flex flex-col space-y-4 px-4 py-3 bg-[#353642] text-white md:hidden mt-2">
      {/* Linkler */}
      {links.map((link, i) => (
        <a key={i} href={link.href} className="text-base font-medium hover:text-gray-300">
          {link.label}
        </a>
      ))}

      <hr className="border-gray-600" />

      {/* Sağ Menü Öğeleri */}
      <a href={`/${language === "TR" ? "tr" : "en"}`} className="text-base font-medium hover:text-gray-300">{currentMenu.home}</a>

      {/* Dijital Vitrinler Dropdown */}
      <div>
        <button
          onClick={() => setEventsDropdownOpen(!eventsDropdownOpen)}
          className="flex items-center gap-1 text-base font-medium hover:text-gray-300 "
        >
          {displayLabels.launches}
          {eventsDropdownOpen ? (
            <FaChevronUp className="mt-[2px]" />
          ) : (
            <FaChevronDown className="mt-[2px]" />
          )}
        </button>

        {eventsDropdownOpen && (
          <div className="flex flex-col pl-4 mt-2 space-y-1 text-base">
            <button
              onClick={() =>
                navigate(`/${language.toLowerCase()}/${currentMenu.currentLaunches.replace(/\s+/g, '-').toLowerCase()}`)
              }
              className="block w-full text-left px-4 py-2 hover:bg-gray-300 text-white font-medium"
            >
              {displayLabels.currentLaunches}
            </button>
            <button
              onClick={() =>
                navigate(`/${language.toLowerCase()}/${currentMenu.upcomingLaunches.replace(/\s+/g, '-').toLowerCase()}`)
              }
              className="block w-full text-left px-4 py-2 hover:bg-gray-300 text-white font-medium"
            >
              {displayLabels.upcomingLaunches}
            </button>
            <button
              onClick={() =>
                navigate(`/${language.toLowerCase()}/${currentMenu.pastLaunches.replace(/\s+/g, '-').toLowerCase()}`)
              }
              className="block w-full text-left px-4 py-2 hover:bg-gray-300 text-white font-medium"
            >
              {displayLabels.pastLaunches}
            </button>
          </div>
        )}
      </div>


      {/* Dil Seçici Dropdown */}
      <div>
        <button
          onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          className="flex items-center gap-2 text-base font-medium  hover:text-gray-300"
        >
          <Flag code={currentMenu.flagCode} className="w-5 h-4" />
          <span className="notranslate">{language}</span>
          {langDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {langDropdownOpen && (
          <div className="flex flex-col mt-2 bg-[#353642] text-white shadow-md p-2 space-y-1 text-sm font-medium rounded-md border-t border-gray-600">
            {(availableLanguages || Object.keys(languageTable)).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang as keyof typeof languageTable)}
                className="flex items-center w-full px-4 py-2  hover:text-gray-300 text-white"
              >
                <Flag code={languageTable[lang as keyof typeof languageTable].flagCode} className="mr-2 w-5" />
                <span>{lang}</span>
              </button>
            ))}
          </div>
        )}
      </div>



      {/* Giriş Yap veya Çıkış Yap butonu */}
      {visitorId ? (
        <button
          onClick={handleLogout}
          className="text-white px-4 py-1 text-base font-medium  hover:text-gray-300 transition duration-300"
        >
          {currentMenu.logout}
        </button>
      ) : (
        <button
          onClick={() => navigate(`/${language.toLowerCase()}/${currentMenu.login.replace(/\s+/g, '-').toLowerCase()}`)}
          className="text-white px-4 py-1 text-base font-medium  hover:text-gray-300 transition duration-300"
        >
          {currentMenu.login}
        </button>
      )}

    </div>
  );
};

export default TopBarMobile;
