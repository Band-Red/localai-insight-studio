import React, { useEffect, useState, useRef } from 'react';
import { Zap } from 'lucide-react';
import styles from './SplashScreen.module.css';

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(onFinish, 400);
                    return 100;
                }
                const increment = prev < 30 ? 3 : prev < 70 ? 2 : 1.5;
                return Math.min(prev + increment, 100);
            });
        }, 35);

        return () => clearInterval(timer);
    }, [onFinish]);

    useEffect(() => {
        if (progressRef.current) {
            progressRef.current.style.setProperty('--progress', `${progress}%`);
        }
    }, [progress]);

    return (
        <div className={styles.splashContainer}>
            <div className={styles.logoContainer}>
                <div className={styles.logoRing}></div>
                <div className={styles.logoInner}>
                    <Zap size={34} color="#050507" strokeWidth={3} />
                </div>
            </div>

            <h1 className={styles.title}>LocalAI Studio</h1>
            <p className={styles.subtitle}>المحرك السيادي المستقل</p>

            <div className={styles.loaderBar}>
                <div
                    ref={progressRef}
                    className={styles.loaderProgress}
                ></div>
            </div>
            <p className={styles.statusText}>
                {progress < 40 ? 'تأمين الاتصال المحلي المباشر...' :
                    progress < 80 ? 'تحميل المحرك السيادي...' :
                        'مرحبا بك في بيئتك الآمنة'}
            </p>
        </div>
    );
};

export default SplashScreen;
