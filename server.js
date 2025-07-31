import { BlobServiceClient } from '@azure/storage-blob';
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Disable caching for development
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Azure config
const connectionString = process.env.VITE_AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.VITE_AZURE_STORAGE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Serve static files from dist directory (for production) or root (for development)
const staticPath = process.env.NODE_ENV === 'production' ? join(__dirname, 'dist') : __dirname;
app.use(express.static(staticPath));

// Serve index.html for all routes except /api
app.get(/^(?!\/api\/).+/, (req, res) => {
    const indexPath = process.env.NODE_ENV === 'production' ? join(__dirname, 'dist', 'index.html') : join(__dirname, 'index.html');
    res.sendFile(indexPath);
});

// Get SAS URL for a specific file
app.get('/api/getsasurl/:filename', async (req, res) => {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(req.params.filename);

        const sasUrl = await blobClient.generateSasUrl({
            permissions: 'r',
            startsOn: new Date(),
            expiresOn: new Date(Date.now() + 30 * 60000)
        });

        res.json({ url: sasUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a random track for shuffle mode
app.get('/api/shuffle', async (req, res) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const tracks = [];

        for await (const blob of containerClient.listBlobsFlat()) {
            if (blob.name.match(/\.(mp3|flac|wav|m4a)$/i)) {
                tracks.push(blob.name);
            }
        }

        if (tracks.length === 0) {
            return res.status(404).json({ error: 'No tracks found to shuffle.' });
        }

        const randomIndex = Math.floor(Math.random() * tracks.length);
        const randomTrack = tracks[randomIndex];

        res.json({ track: randomTrack });
    } catch (error) {
        console.error('Error getting random track:', error);
        res.status(500).json({ error: 'Failed to get random track' });
    }
});

// Get list of all music files
app.get('/api/tracks', async (req, res) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const tracks = [];

        for await (const blob of containerClient.listBlobsFlat()) {
            if (blob.name.match(/\.(mp3|flac|wav|m4a)$/i)) {
                tracks.push(blob.name);
            }
        }

        res.json({ tracks });
    } catch (error) {
        console.error('Error listing tracks:', error);
        res.status(500).json({ error: 'Failed to list tracks' });
    }
});

// Get version info
app.get('/api/version', (req, res) => {
    try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
        res.json({
            version: packageJson.version,
            name: packageJson.name,
            description: packageJson.description
        });
    } catch (error) {
        console.error('Error reading version:', error);
        res.status(500).json({ error: 'Failed to get version info' });
    }
});



const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
