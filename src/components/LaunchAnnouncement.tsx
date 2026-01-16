import React, { useEffect, useState } from 'react';

interface LaunchAnnouncementProps {
    startDate: Date;
    endDate: Date;
}

const LaunchAnnouncement: React.FC<LaunchAnnouncementProps> = ({ startDate, endDate }) => {
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [isVisible, setIsVisible] = useState<boolean>(true);

    useEffect(() => {
        const today = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        let message = '';

        if (today < start) {
            message = `🚀 Bu lansman ${start.toLocaleDateString()} tarihinde yayında!`;
        } else if (today > end) {
            message = `⏰ Lansman ${start.toLocaleDateString()} - ${end.toLocaleDateString()} tarihleri arasında gerçekleşti.`;
        }

        setCurrentMessage(message);

        // Görünüm geçişi için interval ayarlama
        const intervalId = setInterval(() => {
            setIsVisible((prev) => !prev);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [startDate, endDate]);

    return (
        <div className="fixed top-20 left-0 w-full z-50 flex justify-center items-center overflow-hidden">
            <div
                className={`transition-opacity duration-1000 ease-in-out border border-gray-300 rounded-lg bg-red-800 text-white px-6 py-3 shadow-2xl transform-gpu ${isVisible ? 'opacity-100' : 'opacity-0'
                    } animate-bounce`}
            >
                <p className="text-xl font-bold whitespace-nowrap tracking-wide">
                    {currentMessage}
                </p>
            </div>
        </div>
    );
};

export default LaunchAnnouncement;
