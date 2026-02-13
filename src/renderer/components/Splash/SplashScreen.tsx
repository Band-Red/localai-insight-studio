import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(onFinish, 400); // سنابي أكثر في الانتقال
                    return 100;
                }
                // زيادة متغيرة تعطي إحساساً بالتحميل الحقيقي
                const increment = prev < 30 ? 3 : prev < 70 ? 2 : 1.5;
                return Math.min(prev + increment, 100);
            });
        }, 35);

        return () => clearInterval(timer);
    }, [onFinish]);

    return (
        <div className="main-container">
            <div className="logo-container">
                <div className="logo-ring"></div>
                <div className="logo-inner">
                    <Zap size={34} color="#050507" strokeWidth={3} />
                </div>
            </div>

            <h1 className="title">LocalAI Studio</h1>
            <p className="subtitle">المحرك السيادي المستقل</p>

            <div className="loader-bar">
                <div
                    className="loader-progress"
                    style={{ width: `${progress}%`, animation: 'none' }}
                ></div>
            </div>
            <p className="status-text">
                {progress < 40 ? 'تأمين الاتصال المحلي المباشر...' :
                    progress < 80 ? 'تحميل المحرك السيادي...' :
                        'مرحبا بك في بيئتك الآمنة'}
            </p>
        </div>
    );
};

export default SplashScreen;
