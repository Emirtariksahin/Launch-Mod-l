import React, { useEffect } from 'react';

interface SessionExpiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ 
    isOpen, 
    onClose
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-fadeIn">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                    <svg 
                        className="w-8 h-8 text-red-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                        />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
                    Oturum Sonlandırıldı
                </h3>
                <p className="text-center text-gray-600 mb-6">
                    Başka bir cihaz veya tarayıcıdan giriş yapıldığı için oturumunuz sonlandırıldı.
                </p>
                <button
                    onClick={onClose}
                    className="w-full bg-red-900 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
                >
                    Giriş Sayfasına Git
                </button>
            </div>
        </div>
    );
};

export default SessionExpiredModal;






