
const QUANT_KEYS = [
    'Q2_K', 'Q3_K_S', 'Q3_K_M', 'Q3_K_L',
    'Q4_K_S', 'Q4_0', 'Q4_K_M', 'Q5_K_S',
    'Q5_0', 'Q5_K_M', 'Q6_K', 'Q8_0', 'F16', 'F32', 'بدون ضغط'
];

function detectQuantization(filename: string): string {
    const upper = filename.toUpperCase();
    for (const q of QUANT_KEYS) {
        if (upper.includes(q.replace('_', '-')) || upper.includes(q)) {
            return q;
        }
    }
    return 'Unknown';
}

const testFiles = [
    'llama-v3-8b-q4_k_m.gguf',
    'mistral-7b-v0.1.F16.gguf',
    'phi-3-mini-4k-instruct-q8_0.gguf',
    'custom-model-بدون ضغط.gguf',
    'random-model.gguf'
];

console.log('--- Quantization Detection Test ---');
testFiles.forEach(f => {
    console.log(`File: ${f} -> Detected: ${detectQuantization(f)}`);
});

function getSmartSuggestionSnippet(modelSizeMB: number, quantization: string) {
    let suggestedRamGb = Math.min(Math.ceil(modelSizeMB / 1024) + 2, 16); // simplified for test
    let temperature = 0.7;

    const quant = quantization;
    if (quant.includes('Q8') || quant.includes('F16') || quant.includes('F32') || quant === 'بدون ضغط') {
        temperature = 0.5;
        if (quant === 'بدون ضغط' || quant === 'F16' || quant === 'F32') {
            suggestedRamGb = Math.max(suggestedRamGb, Math.ceil(modelSizeMB / 1024) + 4);
        }
    }
    return { suggestedRamGb, temperature };
}

console.log('\n--- Smart Suggestion Logic Test ---');
const scenarios = [
    { size: 5000, quant: 'Q4_K_M' },
    { size: 5000, quant: 'F16' },
    { size: 5000, quant: 'بدون ضغط' },
    { size: 15000, quant: 'Q8_0' }
];

scenarios.forEach(s => {
    const result = getSmartSuggestionSnippet(s.size, s.quant);
    console.log(`Size: ${s.size}MB, Quant: ${s.quant} -> RAM: ${result.suggestedRamGb}GB, Temp: ${result.temperature}`);
});
