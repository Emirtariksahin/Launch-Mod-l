import React, { useState } from 'react';
import { FaWhatsapp, FaFacebookF, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { MdContentCopy } from 'react-icons/md';
import { FcApproval } from 'react-icons/fc';  // FcApproval ikonunu ekledik

const ShareLinks: React.FC = () => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyUrl = () => {
        const fullUrl = window.location.href;
        navigator.clipboard.writeText(fullUrl)
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3000); // 3 saniye sonra mesajı kaldır
            })
            .catch(err => {
                console.error('URL kopyalanamadı: ', err);
            });
    };

    return (
        <>
            {/* Kopyalama mesajı navbarın hemen altında */}
            {isCopied && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 shadow-md rounded-md px-4 py-2 z-50 flex items-center space-x-2">
                    <FcApproval className="w-5 h-5" />  {/* FcApproval ikonu */}
                    <span>Link başarıyla kopyalandı</span>
                </div>
            )}

            <div className="fixed top-1/4 left-4 flex flex-col items-center space-y-2 z-50">
                {/* URL kopyalama butonu */}
                <button
                    className="group p-1 bg-gray-100 rounded-full shadow hover:bg-white transition"
                    onClick={handleCopyUrl}
                >
                    <MdContentCopy className="text-gray-600 group-hover:text-black" size={20} />
                </button>

                {/* WhatsApp butonu */}
                <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-1 bg-gray-100 rounded-full shadow hover:bg-white transition"
                >
                    <FaWhatsapp className="text-green-500 group-hover:text-black" size={20} />
                </a>

                {/* Twitter (X) butonu */}
                <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-1 bg-gray-100 rounded-full shadow hover:bg-white transition"
                >
                    <FaTwitter className="text-blue-500 group-hover:text-black" size={20} />
                </a>

                {/* LinkedIn butonu */}
                <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-1 bg-gray-100 rounded-full shadow hover:bg-white transition"
                >
                    <FaLinkedinIn className="text-blue-700 group-hover:text-black" size={20} />
                </a>

                {/* Facebook butonu */}
                <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-1 bg-gray-100 rounded-full shadow hover:bg-white transition"
                >
                    <FaFacebookF className="text-blue-700 group-hover:text-black" size={20} />
                </a>
            </div>
        </>
    );
};

export default ShareLinks;
