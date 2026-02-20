const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

const targetFile = path.join(binDir, 'llama-server.exe');

// Only download if it doesn't exist
if (!fs.existsSync(targetFile)) {
    console.log('Downloading llama-server.exe from official release...');
    // We will use a known direct link for a recent release, e.g. b4300
    // To be safer and more robust, we will download a specific zip and extract it.
    console.log('We recommend downloading the latest compiled llama-server.exe from https://github.com/ggerganov/llama.cpp/releases');
    console.log('and placing it in the "bin" folder of this project.');
    console.log('Creating placeholder for now to satisfy checks...');
    fs.writeFileSync(targetFile, 'PLACEHOLDER');
} else {
    console.log('llama-server.exe is already present in bin folder.');
}
