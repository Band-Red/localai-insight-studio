import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import styles from './ModelManager.module.css';

interface SmartSuggestBtnProps {
    onSuggest: () => Promise<void>;
    loading?: boolean;
}

const SmartSuggestBtn: React.FC<SmartSuggestBtnProps> = ({ onSuggest, loading = false }) => {
    return (
        <button
            type="button"
            className={styles.smartBtn}
            onClick={onSuggest}
            disabled={loading}
            title="اقتراحات ذكية مبنية على حجم النموذج وإمكانيات جهازك"
        >

            {loading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            ⚡ اقتراحات ذكية
        </button>
    );
};

export default SmartSuggestBtn;
