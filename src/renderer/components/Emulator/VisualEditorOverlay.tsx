import React, { useState, useEffect } from 'react';
import { Sparkles, X, MousePointer2 } from 'lucide-react';
import styles from './VisualEditorOverlay.module.css';

interface VisualEditorOverlayProps {
    element: {
        tagName: string;
        className: string;
        innerText: string;
        x?: number;
        y?: number;
    } | null;
    onCancel: () => void;
    onSubmit: (instruction: string) => void;
    loading?: boolean;
}

const VisualEditorOverlay: React.FC<VisualEditorOverlayProps> = ({
    element,
    onCancel,
    onSubmit,
    loading = false
}) => {
    const [instruction, setInstruction] = useState('');

    // Reset unique state when element changes
    useEffect(() => {
        setInstruction('');
    }, [element]);

    if (!element) return null;

    // Calculate position (try to keep it near element but within bounds)
    const style: React.CSSProperties = {
        top: `${Math.min(element.y || 100, window.innerHeight - 250)}px`,
        left: `${Math.min(element.x || 100, window.innerWidth - 350)}px`,
    };

    return (
        <div className={styles.visualEditorContainer}>
            <div className={styles.editorOverlay} style={style}>
                <div className={styles.elementSummary}>
                    <MousePointer2 size={12} />
                    <span>تعديل العنصر: <span className={styles.tagName}>&lt;{element.tagName.toLowerCase()}&gt;</span></span>
                </div>

                <div className={styles.inputWrapper}>
                    <input
                        autoFocus
                        className={styles.editInput}
                        placeholder="اشرح التعديل المطلوب (مثلاً: غير اللون للأحمر)..."
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && instruction.trim() && !loading) {
                                onSubmit(instruction);
                            }
                            if (e.key === 'Escape') onCancel();
                        }}
                    />
                </div>

                <div className={styles.actionButtons}>
                    <button className={styles.cancelBtn} onClick={onCancel}>إلغاء</button>
                    <button
                        className={styles.submitBtn}
                        disabled={!instruction.trim() || loading}
                        onClick={() => onSubmit(instruction)}
                    >
                        {loading ? 'جاري المعالجة...' : <><Sparkles size={14} /> تطبيق</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VisualEditorOverlay;
