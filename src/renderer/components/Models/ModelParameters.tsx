import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import styles from './ModelManager.module.css';
import SmartSuggestBtn from './SmartSuggestBtn';

export interface ModelParamValues {
    systemPrompt: string;
    temperature: number;
    topK: number;
    topP: number;
    minP: number;
    repeatPenalty: number;
    contextOverflow: 'truncate' | 'roll' | 'stop';
    stopStrings: string;
    cpuThreads: number;
    structuredOutput: boolean;
    draftModel: string;
    draftingCutoff: number;
    minDraftSize: number;
    maxDraftSize: number;
    visualizeDraftTokens: boolean;
    conversationNotes: string;
}

export const defaultModelParams: ModelParamValues = {
    systemPrompt: 'أنت مساعد ذكاء اصطناعي محلي متخصص في مساعدة المطورين.',
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    minP: 0.05,
    repeatPenalty: 1.1,
    contextOverflow: 'truncate',
    stopStrings: '',
    cpuThreads: 4,
    structuredOutput: false,
    draftModel: '',
    draftingCutoff: 0.75,
    minDraftSize: 1,
    maxDraftSize: 5,
    visualizeDraftTokens: false,
    conversationNotes: '',
};

interface ModelParametersProps {
    params: ModelParamValues;
    modelId: string | null;
    onChange: (params: ModelParamValues) => void;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
    <div className={styles.field}>
        <label className={styles.label}>{label}</label>
        <div className={styles.sliderRow}>
            <input
                type="range"
                className={styles.slider}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />
            <span className={styles.sliderValue}>{value}</span>
        </div>
    </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={styles.toggleSlider} />
    </label>
);

const ModelParameters: React.FC<ModelParametersProps> = ({ params, modelId, onChange }) => {
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestion, setSuggestion] = useState<string | null>(null);

    const set = (partial: Partial<ModelParamValues>) => onChange({ ...params, ...partial });

    const handleSmartSuggest = async () => {
        if (!modelId) return;
        setIsSuggesting(true);
        const electron = (window as any).electronAPI;
        if (electron?.getSmartSuggestions) {
            const result = await electron.getSmartSuggestions(modelId);
            if (result) {
                set({
                    temperature: result.temperature,
                    topK: result.topK,
                    topP: result.topP,
                    repeatPenalty: result.repeatPenalty,
                    cpuThreads: result.cpuThreads,
                });
                setSuggestion(result.reasoning);
            }
        }
        setIsSuggesting(false);
    };

    return (
        <div>
            {suggestion && (
                <div className={styles.suggestionAlert}>
                    <strong>✦ اقتراح ذكي:</strong> {suggestion}
                </div>
            )}

            {/* Header */}
            <div className={styles.sectionHeaderRow}>
                <div className={styles.sectionTitle}>
                    <SlidersHorizontal size={18} /><span>معلمات النموذج</span>
                </div>
                <SmartSuggestBtn onSuggest={handleSmartSuggest} loading={isSuggesting} />
            </div>

            {/* System Prompt */}
            <div className={styles.field}>
                <label className={styles.label}>System Prompt</label>
                <textarea
                    className={styles.textarea}
                    value={params.systemPrompt}
                    onChange={(e) => set({ systemPrompt: e.target.value })}
                    rows={4}
                    dir="rtl"
                />
            </div>

            <div className={styles.divider} />

            {/* Sampling */}
            <div className={styles.sectionTitle}><span>Sampling Parameters</span></div>

            <div className={styles.formGrid}>
                <Slider label="Temperature" value={params.temperature} min={0} max={2} step={0.05} onChange={(v) => set({ temperature: v })} />
                <Slider label="Top K Sampling" value={params.topK} min={1} max={100} step={1} onChange={(v) => set({ topK: v })} />
                <Slider label="Top P Sampling" value={params.topP} min={0} max={1} step={0.01} onChange={(v) => set({ topP: v })} />
                <Slider label="Min P Sampling" value={params.minP} min={0} max={0.5} step={0.01} onChange={(v) => set({ minP: v })} />
                <Slider label="Repeat Penalty" value={params.repeatPenalty} min={1.0} max={2.0} step={0.05} onChange={(v) => set({ repeatPenalty: v })} />
                <Slider label="CPU Threads" value={params.cpuThreads} min={1} max={32} step={1} onChange={(v) => set({ cpuThreads: v })} />
            </div>

            <div className={styles.formGrid}>
                <div className={styles.field}>
                    <label className={styles.label}>Context Overflow</label>
                    <select
                        className={styles.select}
                        value={params.contextOverflow}
                        onChange={(e) => set({ contextOverflow: e.target.value as any })}
                    >
                        <option value="truncate">Truncate (قطع البداية)</option>
                        <option value="roll">Roll (استبدال دائري)</option>
                        <option value="stop">Stop (إيقاف عند الامتلاء)</option>
                    </select>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Stop Strings (مفصولة بفاصلة)</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={params.stopStrings}
                        onChange={(e) => set({ stopStrings: e.target.value })}
                        placeholder='مثال: </s>, [END]'
                    />
                </div>
            </div>

            {/* Toggles */}
            <div className={styles.toggleRow}>
                <div>
                    <div className={styles.toggleLabel}>Structured Output</div>
                    <div className={styles.toggleHint}>إخراج JSON منظم (يتطلب دعم النموذج)</div>
                </div>
                <Toggle checked={params.structuredOutput} onChange={(v) => set({ structuredOutput: v })} />
            </div>

            {/* Speculative Decoding */}
            <div className={styles.divider} />
            <div className={styles.sectionTitle}><span>Speculative Decoding</span></div>

            <div className={styles.formGrid}>
                <div className={styles.field}>
                    <label className={styles.label}>Draft Model</label>
                    <select className={styles.select} value={params.draftModel} onChange={(e) => set({ draftModel: e.target.value })}>
                        <option value="">Please load a model first</option>
                    </select>
                </div>

                <Slider
                    label="Drafting Probability Cutoff"
                    value={params.draftingCutoff}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(v) => set({ draftingCutoff: v })}
                />
                <Slider label="Min Draft Size" value={params.minDraftSize} min={1} max={10} step={1} onChange={(v) => set({ minDraftSize: v })} />
                <Slider label="Max Draft Size" value={params.maxDraftSize} min={1} max={20} step={1} onChange={(v) => set({ maxDraftSize: v })} />
            </div>

            <div className={styles.toggleRow}>
                <div>
                    <div className={styles.toggleLabel}>Visualize accepted draft tokens</div>
                </div>
                <Toggle checked={params.visualizeDraftTokens} onChange={(v) => set({ visualizeDraftTokens: v })} />
            </div>

            {/* Conversation Notes */}
            <div className={styles.divider} />
            <div className={styles.field}>
                <label className={styles.label}>Conversation Notes</label>
                <textarea
                    className={styles.textarea}
                    value={params.conversationNotes}
                    onChange={(e) => set({ conversationNotes: e.target.value })}
                    rows={3}
                    placeholder="ملاحظات إضافية للجلسة..."
                    dir="rtl"
                />
            </div>
        </div>
    );
};

export default ModelParameters;
