import React from 'react';
import styles from './ModelManager.module.css';

const QUANTIZATIONS = [
    { name: 'Q2_K', ratio: 0.28, note: 'الأصغر - جودة منخفضة' },
    { name: 'Q3_K_S', ratio: 0.34, note: 'صغير جداً' },
    { name: 'Q3_K_M', ratio: 0.36, note: 'صغير متوازن' },
    { name: 'Q3_K_L', ratio: 0.38, note: 'صغير + جودة أعلى' },
    { name: 'Q4_0', ratio: 0.45, note: 'سريع - موصى للـ CPU' },
    { name: 'Q4_K_S', ratio: 0.46, note: 'متوازن' },
    { name: 'Q4_K_M', ratio: 0.48, note: '⭐ موصى به' },
    { name: 'Q5_0', ratio: 0.55, note: 'جودة عالية' },
    { name: 'Q5_K_S', ratio: 0.56, note: 'جيد جداً' },
    { name: 'Q5_K_M', ratio: 0.58, note: 'جيد جداً+' },
    { name: 'Q6_K', ratio: 0.66, note: 'جودة ممتازة' },
    { name: 'Q8_0', ratio: 0.83, note: 'شبه كامل' },
    { name: 'F16', ratio: 1.0, note: 'كامل - GPU فقط' },
    { name: 'F32', ratio: 2.0, note: 'مرجعي - ثقيل جداً' },
];

interface QuantizationSelectorProps {
    selected: string;
    modelSizeMB: number;
    onChange: (q: string) => void;
}

const QuantizationSelector: React.FC<QuantizationSelectorProps> = ({ selected, modelSizeMB, onChange }) => {
    const estimateRam = (ratio: number) => {
        if (!modelSizeMB || modelSizeMB === 0) return 'حجم غير معروف';
        const mb = modelSizeMB * ratio;
        return mb >= 1024 ? `~${(mb / 1024).toFixed(1)} GB` : `~${Math.round(mb)} MB`;
    };

    return (
        <div className={styles.quantGrid}>
            {QUANTIZATIONS.map((q) => (
                <div
                    key={q.name}
                    className={`${styles.quantOption} ${selected === q.name ? styles.quantOptionSelected : ''}`}
                    onClick={() => onChange(q.name)}
                >
                    <div className={styles.quantName}>{q.name}</div>
                    <div className={styles.quantMeta}>{estimateRam(q.ratio)}</div>
                    <div className={styles.quantMeta}>{q.note}</div>
                </div>
            ))}
        </div>
    );
};

export default QuantizationSelector;
