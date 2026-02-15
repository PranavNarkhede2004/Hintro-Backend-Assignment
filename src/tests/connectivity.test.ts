import axios from 'axios';

async function checkHealth(url: string) {
    console.log(`Checking health at ${url} ...`);
    try {
        const res = await axios.get(url, { timeout: 2000 });
        console.log(`✅ SUCCESS: ${url} - Status: ${res.status}`);
    } catch (error: any) {
        console.error(`❌ FAILED: ${url}`);
        console.error(`   Code: ${error.code || 'UNKNOWN'}`);
        console.error(`   Message: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
        }
    }
}

async function run() {
    await checkHealth('http://127.0.0.1:3000/health');
    await checkHealth('http://localhost:3000/health');
    await checkHealth('http://[::1]:3000/health');
}

run();
