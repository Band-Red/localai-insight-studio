/**
 * المكون: ModelList
 * الوظيفة: تعرض قائمة ملفات GGUF المتاحة، وتسمح باختيار نموذج لتهيئته أو تشغيله.
 * المكان: داخل تبويب "مكتبة النماذج".
 */
import React from 'react';
import { Trash2, Loader2, Settings2 } from 'lucide-react';
import styles from './ModelManager.module.css';

interface GgufModel {
    id: string;
    name: string;
    fileSizeMB: number;
    quantization: string;
    status: 'idle' | 'loading' | 'ready' | 'error';
    errorMsg?: string;
}

interface ModelListProps {
    models: GgufModel[];
    activeModelId: string | null;
    selectedId: string | null; // النموذج المختار حالياً للإعداد
    onSelect: (id: string) => void;
    onLoad: (id: string) => void;
    onStop: (id: string) => void;
    onDelete: (id: string) => void;
}

const ModelList: React.FC<ModelListProps> = ({ models, activeModelId, selectedId, onSelect, onLoad, onStop, onDelete }) => {
    if (models.length === 0) {
        return <div className={styles.emptyState}>لا توجد نماذج بعد — ارفع ملف GGUF للبدء</div>;
    }

    const statusDotClass = (status: string) => {
        switch (status) {
            case 'loading': return `${styles.statusDot} ${styles.statusLoading}`;
            case 'ready': return `${styles.statusDot} ${styles.statusReady}`;
            case 'error': return `${styles.statusDot} ${styles.statusError}`;
            default: return `${styles.statusDot} ${styles.statusIdle}`;
        }
    };

    /**
     * تحديد التسمية الوصفية لحالة النموذج
     */
    const statusLabel = (m: GgufModel) => {
        switch (m.status) {
            case 'loading': return 'جاري التحميل...';
            case 'ready': return 'جاهز للعمل';
            case 'error': return m.errorMsg || 'فشل البدء';
            default: return 'خامل';
        }
    };

    return (
        <div className={styles.modelList}>
            {models.map((model) => (
                <div
                    key={model.id}
                    className={`${styles.modelItem} ${model.id === activeModelId ? styles.modelItemActive : ''} ${model.id === selectedId ? styles.modelItemSelected : ''}`}
                    onClick={() => onSelect(model.id)}
                >
                    <div className={statusDotClass(model.status)} title={statusLabel(model)} />
                    <div className={styles.modelInfo}>
                        <div className={styles.modelName} title={model.name}>{model.name}</div>
                        <div className={styles.modelMeta}>
                            <span className={styles.badge}>{model.quantization}</span>
                            <span className={styles.badgeGray}>{model.fileSizeMB >= 1024
                                ? `${(model.fileSizeMB / 1024).toFixed(1)} GB`
                                : `${model.fileSizeMB} MB`}
                            </span>
                            {model.status === 'error' && (
                                <span className={styles.badgeDanger} title={model.errorMsg}>⚠ خطأ فني</span>
                            )}
                        </div>
                    </div>
                    <div className={styles.modelActions}>
                        {model.id === activeModelId ? (
                            <button type="button" className={styles.btnStop} onClick={(e) => { e.stopPropagation(); onStop(model.id); }}>إيقاف</button>
                        ) : (
                            <button 
                                type="button" 
                                className={`${styles.btnConfig} ${selectedId === model.id ? styles.btnConfigActive : ''}`}
                                onClick={(e) => { e.stopPropagation(); onSelect(model.id); }}
                            >
                                <Settings2 size={14} />
                                إعداد
                            </button>
                        )}
                        <button type="button" className={styles.btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(model.id); }} title="حذف النموذج نهائياً">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ModelList;
