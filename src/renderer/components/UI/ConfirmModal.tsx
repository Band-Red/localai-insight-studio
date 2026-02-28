import React from 'react';
import { X, AlertTriangle, Check, CornerDownLeft } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء'
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} dir="rtl">
                <div className={styles.header}>
                    <div className={styles.titleArea}>
                        <AlertTriangle size={18} className={styles.warningIcon} />
                        <h3>{title}</h3>
                    </div>
                    <button className={styles.closeBtn} onClick={onCancel}>
                        <X size={18} />
                    </button>
                </div>
                
                <div className={styles.body}>
                    <p>{message}</p>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onCancel}>
                        <X size={14} />
                        {cancelText}
                    </button>
                    <button className={styles.confirmBtn} onClick={onConfirm}>
                        <Check size={14} />
                        {confirmText}
                    </button>
                </div>

                {/* Cyberpunk decoration */}
                <div className={styles.glitchLine}></div>
                <div className={styles.cornerDecor}></div>
            </div>
        </div>
    );
};

export default ConfirmModal;
