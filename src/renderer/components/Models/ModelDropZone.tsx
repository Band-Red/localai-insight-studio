import React, { useRef, useState } from 'react';
import { Brain, UploadCloud } from 'lucide-react';
import styles from './ModelManager.module.css';

interface ModelDropZoneProps {
    onModelAdded: () => void;
    disabled?: boolean;
}

const ModelDropZone: React.FC<ModelDropZoneProps> = ({ onModelAdded, disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleRegister = async (filePath: string) => {
        if (!filePath.toLowerCase().endsWith('.gguf')) {
            setError('يُقبل فقط ملفات .gguf');
            return;
        }
        setIsLoading(true);
        setError(null);
        const electron = (window as any).electronAPI;
        if (electron?.registerGgufPath) {
            const result = await electron.registerGgufPath(filePath);
            if (!result.success) {
                setError(result.error || 'فشل في إضافة النموذج');
            } else {
                onModelAdded();
            }
        }
        setIsLoading(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            // In Electron, the file path is accessible via the file object's path property
            const filePath = (file as any).path;
            if (filePath) {
                handleRegister(filePath);
            } else {
                setError('تعذّر الوصول إلى مسار الملف');
            }
        }
    };

    const handleClickZone = async () => {
        console.log('ModelDropZone clicked');
        if (disabled || isLoading) return;

        setError(null);
        const electron = (window as any).electronAPI;
        if (electron?.selectGgufFile) {
            setIsLoading(true);
            const result = await electron.selectGgufFile();
            if (result.success) {
                onModelAdded();
            } else if (result.error && result.error !== 'Cancelled') {
                setError(result.error);
            }
            setIsLoading(false);
        }
    };

    const zoneClass = [
        styles.dropZone,
        isDragging ? styles.dropZoneActive : '',
        error ? styles.dropZoneError : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            className={zoneClass}
            onClick={handleClickZone}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); setError(null); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className={styles.dropIcon}>
                {isLoading ? <UploadCloud size={44} color="#00ffcc" /> : <Brain size={44} color={error ? '#ef4444' : '#00ffcc'} />}
            </div>
            <div className={styles.dropTitle}>
                {isDragging ? 'أفلت الملف هنا...' : isLoading ? 'جاري الإضافة...' : 'اسحب ملف GGUF أو انقر للاختيار'}
            </div>
            <div className={styles.dropSubtitle}>يُقبل ملف واحد بصيغة .gguf (حد أقصى 5 نماذج)</div>
            {error && <div className={styles.dropError}>⚠ {error}</div>}
            <input ref={inputRef} type="file" accept=".gguf" hidden />
        </div>
    );
};

export default ModelDropZone;
