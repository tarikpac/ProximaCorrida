import axios from 'axios';

async function triggerScraper() {
    const apiUrl = process.env.API_URL || 'https://proximacorrida.onrender.com';
    const apiKey = process.env.API_KEY; // Optional: Add security later if needed

    console.log(`Triggering scraper at ${apiUrl}...`);

    try {
        const response = await axios.post(`${apiUrl}/scraper/trigger`);
        console.log('Scraper triggered successfully:', response.data);
    } catch (error) {
        console.error('Failed to trigger scraper:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

triggerScraper();
