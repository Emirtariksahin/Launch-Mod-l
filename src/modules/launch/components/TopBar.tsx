import React, { useState, useEffect } from "react";
import { FaLinkedin, FaInstagram, FaFacebook, FaYoutube, FaXTwitter, FaSpotify, FaWhatsapp, FaEnvelope, FaBars } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";

const TopBar = () => {
    const [language, setLanguage] = useState("tr");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const lang = document.documentElement.lang || "tr";
            setLanguage(lang);
        });

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
        return () => observer.disconnect();
    }, []);

    const links = [
        { labelTr: "EKOSİSTEM", labelEn: "ECOSYSTEM", href: language === "tr" ? "https://damise.com/tr/ekosistem" : "https://damise.com/en/ecosystem/" },
        { labelTr: "AKADEMİ", labelEn: "ACADEMY", href: language === "tr" ? "https://academy.damise.com/tr" : "https://academy.damise.com/en" },
        { labelTr: "TEDARİKÇİ YÖNETİM SİSTEMİ", labelEn: "SUPPLIER MANAGEMENT SYSTEM", href: language === "tr" ? "https://damise.com/tr/tedarikci-sistemi/anketler" : "https://damise.com/en/supplier-management-system/surveys/" },
        { labelTr: "DİJİTAL VİTRİN", labelEn: "DIGITAL SHOWCASE", href: language === "tr" ? "https://ds.damise.com/" : "https://ds.damise.com/en" },
        { labelTr: "DİJİTAL LANSMAN", labelEn: "DIGITAL LAUNCH", href: language === "tr" ? "https://dl.damise.com/" : "https://dl.damise.com/en" },
        { labelTr: "İHALELER", labelEn: "TENDERS", href: language === "tr" ? "https://damise.com/tr/ihaleler" : "https://damise.com/en/tenders/" }
    ];

    return (
        <header className="w-full bg-[#353642] text-white py-3 px-4 fixed top-0 left-0 z-[20]">
            {/* Navbar İçeriği */}
            <div className="flex justify-between items-center">

                {/* Hamburger Menü */}
                <button className="md:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </button>

                {/* Büyük ekranlar için navbar */}
                <nav className="hidden md:flex space-x-6 text-sm font-semibold">
                    {links.map((link, index) => (
                        <a key={index} href={link.href} className="hover:text-gray-300 uppercase">
                            {language === "tr" ? link.labelTr : link.labelEn}
                        </a>
                    ))}
                </nav>

                {/* Büyük ekranlar için sosyal medya */}
                <div className="hidden md:flex space-x-3 text-lg items-center">
                    <a href="https://www.linkedin.com/company/damise" className="hover:text-gray-400"><FaLinkedin /></a>
                    <a href="https://www.instagram.com/damise_global/" className="hover:text-gray-400"><FaInstagram /></a>
                    <a href="https://www.facebook.com/DamiseGlobal" className="hover:text-gray-400"><FaFacebook /></a>
                    <a href="https://www.youtube.com/@damiseglobal" className="hover:text-gray-400"><FaYoutube /></a>
                    <a href="https://x.com/damise_global" className="hover:text-gray-400"><FaXTwitter /></a>
                    <a href="https://open.spotify.com/show/0TUHY6XUPuHD9tNik3U23Z" className="hover:text-gray-400"><FaSpotify /></a>
                    <a href="https://wa.me/+902169991850" className="hover:text-gray-400"><FaWhatsapp /></a>
                    <a href="mailto:info@damise.com" className="hover:text-gray-400 flex items-center text-sm">
                        <FaEnvelope className="mr-1" /> info@damise.com
                    </a>
                </div>
            </div>

            {/* Mobil Menü Açıldığında Gösterilecek Kısım */}
            {menuOpen && (
                <div className="md:hidden bg-[#353642] w-full absolute left-0 top-[100%] shadow-lg py-4 px-6 flex flex-col space-y-4">
                    {links.map((link, index) => (
                        <a key={index} href={link.href} className="hover:text-gray-300 uppercase block">
                            {language === "tr" ? link.labelTr : link.labelEn}
                        </a>
                    ))}

                    {/* Mobil için sosyal medya ikonları */}
                    <div className="flex space-x-4 text-lg justify-center mt-4">
                        <a href="https://www.linkedin.com/company/damise" className="hover:text-gray-400"><FaLinkedin /></a>
                        <a href="https://www.instagram.com/damise_global/" className="hover:text-gray-400"><FaInstagram /></a>
                        <a href="https://www.facebook.com/DamiseGlobal" className="hover:text-gray-400"><FaFacebook /></a>
                        <a href="https://www.youtube.com/@damiseglobal" className="hover:text-gray-400"><FaYoutube /></a>
                        <a href="https://x.com/damise_global" className="hover:text-gray-400"><FaXTwitter /></a>
                        <a href="https://open.spotify.com/show/0TUHY6XUPuHD9tNik3U23Z" className="hover:text-gray-400"><FaSpotify /></a>
                        <a href="https://wa.me/+902169991850" className="hover:text-gray-400"><FaWhatsapp /></a>
                    </div>

                    {/* Mail Bilgisi */}
                    <a href="mailto:info@damise.com" className="flex justify-center items-center text-sm mt-2 hover:text-gray-300">
                        <FaEnvelope className="mr-1" /> info@damise.com
                    </a>
                </div>
            )}
        </header>
    );
};

export default TopBar;
