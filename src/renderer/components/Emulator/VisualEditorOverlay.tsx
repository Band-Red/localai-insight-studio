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
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Reset unique state when element changes
    useEffect(() => {
        setInstruction('');
    }, [element]);

    // Update position via Ref to avoid style={} attribute rule violation
    React.useLayoutEffect(() => {
        if (element && containerRef.current) {
            const x = Math.min(element.x || 100, window.innerWidth - 420);
            const y = Math.min(element.y || 100, window.innerHeight - 300);
            containerRef.current.style.setProperty('--x', `${x}px`);
            containerRef.current.style.setProperty('--y', `${y}px`);
        }
    }, [element]);

    if (!element) return null;

    return (
        <div className={styles.visualEditorContainer}>
            <div className={styles.editorOverlay} ref={containerRef}>
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
