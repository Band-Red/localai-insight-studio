import React, { useEffect, useRef } from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (canvas) {
                    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
                }
            }
        }

        for (let i = 0; i < 80; i++) particles.push(new Particle());

        let animationFrameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 0.2;

            particles.forEach(p => {
                p.update();
                particles.forEach(p2 => {
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 120) {
                        ctx.globalAlpha = 1 - (dist / 120);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="splash-wrapper">
            <canvas ref={canvasRef} className="bg-canvas"></canvas>
            <div className="main-container">
                <div className="logo-container">
                    <div className="logo-ring"></div>
                    <div className="logo-inner">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#050507" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                    </div>
                </div>

                <h1 className="splash-title">LocalAI Studio</h1>
                <p className="splash-subtitle">المحرك السيادي المستقل</p>

                <div className="loader-bar">
                    <div className="loader-progress"></div>
                </div>
                <p className="status-text">تأمين الاتصال المحلي المباشر...</p>
            </div>
        </div>
    );
};

export default SplashScreen;
