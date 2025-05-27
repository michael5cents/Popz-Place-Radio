import { BlobServiceClient } from '@azure/storage-blob';
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Azure config
const connectionString = process.env.VITE_AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.VITE_AZURE_STORAGE_CONTAINER_NAME;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Serve index.html for all routes except /api
app.get(/^(?!\/api\/).+/, (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
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
