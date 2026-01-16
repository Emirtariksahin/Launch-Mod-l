import React from "react";

interface LoadingModalProps {
    isOpen: boolean;
    message: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ isOpen, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-700">{message}</p>
            </div>
        </div>
    );
};

export default LoadingModal;