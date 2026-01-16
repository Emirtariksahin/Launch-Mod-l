import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
// @ts-ignore
import Flag from "react-world-flags"; // Bayrak ikonları için
import {
    FaChevronDown,
    FaChevronUp,
    FaSearch,
    FaBars,
    FaTimes,
} from "react-icons/fa"; // Chevron, Search, Hamburger ve Close ikonları
import damiseLogo from "../../../assets/images/Damise.png"; // DAMISE logosunu burada import ediyoruz
import Cookies from 'js-cookie';
import { deleteCookie, triggerGlobalLogout } from '../../../utils/cookies';
import { ssoApi } from '../../../services';

import TopBar from "./TopBar";
import NavbarMobile from "./NavbarMobile";
interface SeoSettings {
    userId: string;
    title: string;
    url: string;
    keywords: string;
    description: string;
    socialImage: string;
    indexStatus: boolean;
    followStatus: boolean;
}

interface Launch {
    _id: string;
    groupNumber: string;
    language: "TR" | "EN"; // Dil sadece 'TR' veya 'EN' olacak
    launchName: string;
    // Diğer alanlar...
}

const Navbar: React.FC = () => {
    const navigate = useNavigate();
  
    const { launchUrl, companyUrl } = useParams<{
        launchUrl: string;
        companyUrl?: string;
    }>(); // URL parametresini alıyoruz
    const [language, setLanguage] = useState<"TR" | "EN">("TR"); // Başlangıç dili TR
    const [isOpen, setIsOpen] = useState(false); // Dropdown menüsünün açık/kapalı durumu
    const [isLaunchMenuOpen, setIsLaunchMenuOpen] = useState(false); // Lansman menüsü açık/kapalı durumu
    const [groupNumber, setGroupNumber] = useState<string>(""); // Mevcut lansmanın grup numarası
    const [userId, setUserId] = useState<string>(""); // Mevcut SEO'dan gelen userId
    const [menuOpen, setMenuOpen] = useState(false); // Mobil menü açık/kapalı durumu
    const [visitorId, setVisitorId] = useState<string | null>(null); // VisitorId kontrolü için state
    const [desktopNavOpen, setDesktopNavOpen] = useState<boolean>(() => {
        const storedValue = localStorage.getItem("desktopNavOpen");
        return storedValue ? JSON.parse(storedValue) : false; // String yerine boolean olarak al
    });



    useEffect(() => {
        localStorage.setItem("desktopNavOpen", JSON.stringify(desktopNavOpen)); // Boolean'ı string olarak sakla
    }, [desktopNavOpen]);




    useEffect(() => {
        // localeStorage'dan visitorId'yi al ve kontrol et
        const storedVisitorId = localStorage.getItem("visitorId");
        setVisitorId(storedVisitorId); // visitorId varsa state'e aktar
    }, []);

    useEffect(() => {
        // URL'ye göre SEO verisini çekiyoruz
        const fetchSeoData = async () => {
            try {
                const response = await axios.get<SeoSettings>(
                    `${process.env.REACT_APP_API_URL}/seosettings/url/${launchUrl}`
                );
                if (response.status === 200) {
                    const seoData = response.data;
                    // SEO'dan gelen userId'yi al
                    setUserId(seoData.userId);

                    // Ardından, lansman veritabanından bilgileri al
                    const launchResponse = await axios.get<Launch>(
                        `${process.env.REACT_APP_API_URL}/launch/${seoData.userId}`
                    );
                    if (launchResponse.status === 200) {
                        const launchData = launchResponse.data;
                        setGroupNumber(launchData.groupNumber); // Grup numarasını al
                        setLanguage(launchData.language); // Dil bilgisini al
                    }
                }
            } catch (error) {
                console.error("SEO ve lansman verisi alınamadı:", error);
            }
        };
        fetchSeoData();
    }, [launchUrl]);

    // Dil değişikliği olduğunda lang attribute'ünü güncelle
    useEffect(() => {
        document.documentElement.lang = language === "TR" ? "tr" : "en";
    }, [language]);

    // Dil değişikliği yapıldığında SEO verisine göre yönlendirme yap ve dropdown'ı kapat
    const handleLanguageChange = async (newLanguage: "TR" | "EN") => {
        try {
            const isCompanyLayout = location.pathname.startsWith(
                `/${launchUrl}/${companyUrl}`
            );
            const isParticipantsLayoutTr = location.pathname.startsWith(
                `/${launchUrl}/katilimcilar`
            );
            console.log("TR", isParticipantsLayoutTr);
            const isParticipantsLayoutEn = location.pathname.startsWith(
                `/${launchUrl}/participants`
            );
            console.log("EN", isParticipantsLayoutEn);

            // Aynı groupNumber'a ve farklı dildeki lansmanı getiriyoruz
            const response = await axios.get<Launch[]>(
                `${process.env.REACT_APP_API_URL}/launch/launches`,
                {
                    params: {
                        groupNumber: groupNumber, // Aynı grup numarasına sahip lansmanı arıyoruz
                        language: newLanguage, // Yeni dil ile lansmanı arıyoruz
                    },
                }
            );
            const currentPath = window.location.pathname;




            if (newLanguage === "TR" && currentPath.startsWith("/en")) {
                // Eğer TR seçilmişse ve URL /en ile başlıyorsa kök (ana domain) rotasına yönlendir
                setLanguage(newLanguage);
                navigate(
                    currentPath === "/en" ? "/" : currentPath.replace("/en", "")
                ); // /en varsa kaldır ve yönlendir
            } else if (newLanguage === "EN" && !currentPath.startsWith("/en")) {
                // Eğer EN seçilmişse ve URL ana sayfa ise, sadece /en'e yönlendir
                if (currentPath === "/") {
                    navigate("/en"); // Ana sayfa için sadece /en
                }
            } else {
                // Zaten uygun dilde ise sadece dili güncelle
                setLanguage(newLanguage);
            }

            const launches = response.data; // Aynı grup numarasındaki lansmanlar

            if (launches.length > 0) {
                if (launchUrl) {
                    const newLaunchId = launches[0]._id; // Yeni dildeki lansmanın ID'sini alıyoruz
                    // Yeni dildeki lansmanın SEO URL'sini bul
                    const seoResponse = await axios.get<SeoSettings>(
                        `${process.env.REACT_APP_API_URL}/seosettings/${newLaunchId}`
                    );
                    if (seoResponse.status === 200) {
                        const newSeoData = seoResponse.data;
                        setLanguage(newLanguage); // Dili güncelle
                        setIsOpen(false); // Menü kapanıyor
                        if (isCompanyLayout) {
                            navigate(`/${newSeoData.url}/${companyUrl}`);
                        } else if (isParticipantsLayoutEn) {
                            navigate(`/${newSeoData.url}/katilimcilar`);
                        } else if (isParticipantsLayoutTr) {
                            navigate(`/${newSeoData.url}/participants`);
                        } else {
                            navigate(`/${newSeoData.url}`); // Yeni sayfaya yönlendiriyoruz
                        }
                    } else if (companyUrl) {
                    }
                }
            } else {
                console.error("İlgili dilde lansman bulunamadı.");
            }
        } catch (error) {
            console.error("Dil değiştirilemedi:", error);
        }
        try {
            const currentPath = window.location.pathname;

            // Türkçe ve İngilizce segment eşleşmeleri
            const urlMappings: Record<string, Record<"TR" | "EN", string>> = {
                "yayindaki-dijital-vitrinler": {
                    TR: "yayindaki-dijital-vitrinler",
                    EN: "ongoing-digital-events",
                },
                "gelecek-dijital-vitrinler": {
                    TR: "gelecek-dijital-vitrinler",
                    EN: "upcoming-digital-events",
                },
                "gecmis-dijital-vitrinler": {
                    TR: "gecmis-dijital-vitrinler",
                    EN: "past-digital-events",
                },
                "giris-yap": { TR: "giris-yap", EN: "login" },
                "ongoing-digital-events": {
                    TR: "yayindaki-dijital-vitrinler",
                    EN: "ongoing-digital-events",
                },
                "upcoming-digital-events": {
                    TR: "gelecek-dijital-vitrinler",
                    EN: "upcoming-digital-events",
                },
                "past-digital-events": {
                    TR: "gecmis-dijital-vitrinler",
                    EN: "past-digital-events",
                },
                login: { TR: "giris-yap", EN: "login" },
            };

            // URL parçalarını ayır
            const segments = currentPath.split("/").filter(Boolean); // Boş segmentleri temizle

            // İlk segment dilse kaldır
            if (segments[0] === "en" || segments[0] === "tr") {
                segments.shift();
            }

            // Belirtilen URL segmentleri dışındaki tüm yolları olduğu gibi bırak
            const hasMapping = segments.some((segment) =>
                Object.keys(urlMappings).includes(segment)
            );

            if (!hasMapping) {
                // Belirtilen eşleşme yoksa mevcut URL'yi olduğu gibi bırak
                setLanguage(newLanguage);
                setIsOpen(false);
                console.warn(
                    "Belirtilen URL eşleşmeleri dışında bir yol, olduğu gibi bırakıldı:",
                    currentPath
                );
                return;
            }

            // Segmentleri çevirmek
            const newSegments = segments.map((segment) => {
                // Mevcut segmentin eşleşen karşılığı varsa, yeni dildeki değerini al
                const mapping = Object.entries(urlMappings).find(
                    ([_, langs]) =>
                        langs[newLanguage] === segment ||
                        langs[language] === segment
                );
                return mapping ? mapping[1][newLanguage] : segment; // Eğer eşleşme yoksa orijinal segmenti kullan
            });

            // Yeni dil segmentini başa ekle
            const newPath = `/${newLanguage === "TR" ? "tr" : "en"
                }/${newSegments.join("/")}`;

            // Yeni URL'ye yönlendir
            navigate(newPath);

            // State'i güncelle
            setLanguage(newLanguage);
            setIsOpen(false); // Menü kapanıyor
        } catch (error) {
            console.error("Dil değiştirilemedi:", error);
        }
    };
    // Dil değişikliği olduğunda Navbar sekmelerini güncellemek için MutationObserver kullanıyoruz
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const newLang = document.documentElement.lang;
            setLanguage(newLang === "tr" ? "TR" : "EN");
        });

        const config = { attributes: true, attributeFilter: ["lang"] };
        observer.observe(document.documentElement, config);

        return () => {
            observer.disconnect();
        };
    }, []);
    // Dropdown menüsünü aç/kapa
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Lansman menüsünü aç/kapa
    const toggleLaunchMenu = () => {
        setIsLaunchMenuOpen(!isLaunchMenuOpen);
    };

    // Mobil menüyü aç/kapa
    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    // Çıkış yap işlemi
    const handleLogout = async () => {
        try {
            // Ecosystem API'ye logout isteği gönder (damise_auth cookie'sini siler)
            await ssoApi.post('/users/logout?platform=panel');
        } catch (error) {
            console.error('SSO Logout API call failed:', error);
        }
        
        // Global logout trigger - diğer tab/window/projeleri bilgilendir
        triggerGlobalLogout();
        
        const storedVisitorId = localStorage.getItem("visitorId");
       
        // localeStorage'dan visitorId'yi sil
        localStorage.removeItem("visitorId");

        // visitorId'yi sıfırla
        setVisitorId(null);
        
        // Lokal admin token'ı temizle
        Cookies.remove('adminToken');
        
        // damise_auth cookie'sini ana domain'den temizle (fallback)
        deleteCookie('damise_auth');
        
        // Logout flag'ini sessionStorage'e kaydet (diğer projeler için)
        sessionStorage.setItem('justLoggedOut', 'true');
        sessionStorage.setItem('logoutTime', Date.now().toString());

        // Admin login sayfasına yönlendir
        navigate('/admin-login');
    };

 
    // Sekmeleri dile göre güncellemek için varsayılan içerik
    const menuItems = {
        TR: {
            home: "Ana Sayfa",
            launches: "Dijital Etkinlikler",
            currentLaunches: "Yayındaki Etkinlikler",
            upcomingLaunches: "Gelecek Etkinlikler",
            pastLaunches: "Geçmiş Etkinlikler",
            login: "Giriş Yap",
            logout: "Çıkış Yap",
        },
        EN: {
            home: "Homepage", // 'Ana Sayfa' = 'Homepage'
            launches: "Digital Showcase", // 'Dijital Vitrinler' = 'Digital Displays'
            currentLaunches: "Ongoing Events", // 'Yayındaki Etkinlikler' = 'Ongoing Events'
            upcomingLaunches: "Upcoming Events", // 'Gelecek Etkinlikler' = 'Upcoming Events'
            pastLaunches: "Past Events", // 'Geçmiş Etkinlikler' = 'Past Events'
            login: "Sign In", // 'Giriş Yap' = 'Sign In'
            logout: "Sign Out", // 'Çıkış Yap' = 'Sign Out'
        },
    };

    const currentMenu = menuItems[language];


   


    return (

        <div

            className={`fixed top-0 left-0 w-full px-4 mt-11 sm:px-8 bg-white z-50 transition-all duration-500 ease-in-out
            ${desktopNavOpen ? "translate-y-0 opacity-100 h-18 shadow-md" : "translate-y-0 opacity-100 h-2 border-b shadow-md"}`}
        >
            <div className={`transition-all duration-500 ease-in-out ${desktopNavOpen ? "opacity-100 h-auto" : "opacity-1 h-0 overflow-hidden"}`}>




                <div className="flex justify-between items-start relative ">
                    {/* Logo sola ortalı sabit */}
                    <div className="flex-shrink-0 flex items-center h-[75px]">
                        <img
                            src={damiseLogo}
                            alt="Logo"
                            className="h-full w-auto cursor-pointer"
                            onClick={() => window.location.href = 'https://damise.com'}
                        />
                    </div>

                    {/* Sağdaki menü yukarı hizalı */}
                    <div className="hidden sm:flex items-start space-x-6 py-6">
                        {/* Navbar Aç/Kapa İçin Ok İkonu */}
                        <button
                            onClick={() => setDesktopNavOpen(!desktopNavOpen)}
                            className={`fixed left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out z-50 bg-white p-2 rounded-full shadow-lg border border-gray-300
                            ${desktopNavOpen ? "top-[64px] opacity-100 text-black" : "top-[13px] opacity-100 text-gray-800"}`}

                        >
                            {desktopNavOpen ? <FaChevronUp size={18} className="text-black" /> : <FaChevronDown size={18} className="text-black" />}
                        </button>


                        {/* Navigasyon ve dil seçenekleri (sadece büyük ekranlarda) */}
                        <div className="hidden sm:flex items-center space-x-6">
                            <button
                                onClick={() =>
                                    navigate(language === "TR" ? "/tr" : "/en")
                                }
                                className="text-gray-700 hover:text-red-800 text-lg font-medium relative group"
                            >
                                {currentMenu.home}
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-800 scale-x-0 group-hover:scale-x-100  transform origin-left transition-transform duration-300"></span>
                            </button>

                            <div className="relative">
                                <button
                                    onClick={toggleLaunchMenu}
                                    className="text-gray-700 hover:text-red-800 text-lg font-medium flex items-center relative group"
                                >
                                    {currentMenu.launches}
                                    {isLaunchMenuOpen ? (
                                        <FaChevronUp className="ml-1 mt-1" />
                                    ) : (
                                        <FaChevronDown className="ml-1 mt-1" />
                                    )}
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-800 scale-x-0 group-hover:scale-x-100 transform origin-left transition-transform duration-300"></span>
                                </button>

                                {isLaunchMenuOpen && (
                                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    language === "TR"
                                                        ? "/tr/yayındaki-dijital-vitrinler"
                                                        : "/en/ongoing-digital-events"
                                                )
                                            }
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
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
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                        >
                                            {currentMenu.upcomingLaunches}
                                        </button>
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    language === "TR"
                                                        ? "/tr/geçmiş-dijital-vitrinler"
                                                        : "/en/past-digital-events"
                                                )
                                            }
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                        >
                                            {currentMenu.pastLaunches}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Giriş Yap veya Çıkış Yap butonu */}
                            {visitorId && visitorId !== "none_user" ? (
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-700 hover:text-red-800 text-lg font-medium relative group"
                                >
                                    {currentMenu.logout}
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-800 scale-x-0 group-hover:scale-x-100 transform origin-left transition-transform duration-300"></span>
                                </button>
                            ) : (
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/${language === "TR" ? "tr/giris-yap" : "en/login"}`,
                                            { state: { from: location.pathname } }
                                        )
                                    }
                                    className="text-gray-700 hover:text-red-800 text-lg font-medium relative group"
                                >
                                    {currentMenu.login}
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-800 scale-x-0 group-hover:scale-x-100 transform origin-left transition-transform duration-300"></span>
                                </button>
                            )}

                            <div className="relative hidden sm:block">
                                <button
                                    onClick={toggleDropdown}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-red-800 text-lg font-medium relative group"
                                >
                                    <Flag code={language === "TR" ? "TUR" : "GBR"} className="w-5 h-4" />
                                    <span className="notranslate">{language}</span>
                                    <span className="absolute bottom-0 left-[1px] w-[calc(100%-4px)] h-0.5 bg-red-800 scale-x-0 group-hover:scale-x-100 transform origin-left transition-transform duration-300"></span>
                                </button>

                                {isOpen && (
                                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-28 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
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
                    </div>
                </div>
            </div>
            <div className="sm:hidden block">
                <NavbarMobile
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    language={language}
                    currentMenu={currentMenu}
                    handleLanguageChange={handleLanguageChange}
                    isOpen={isOpen}
                    toggleDropdown={toggleDropdown}
                />
            </div>

        </div>
    );
};

export default Navbar;
