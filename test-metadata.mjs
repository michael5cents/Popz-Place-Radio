import { BlobServiceClient } from '@azure/storage-blob';
import * as musicMetadata from 'music-metadata-browser';

// Azure Storage configuration
// Replace these with your actual Azure Storage credentials
const connectionString = 'YOUR_AZURE_STORAGE_CONNECTION_STRING';
const containerName = 'YOUR_CONTAINER_NAME';

async function loadMetadata(blobClient, fileName) {
    try {
        console.log(`\nDownloading ${fileName}...`);
        const downloadResponse = await blobClient.download();
        console.log('Download response received');
        
        const chunks = [];
        for await (const chunk of downloadResponse.readableStreamBody) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        console.log(`File downloaded: ${buffer.length} bytes`);

        const metadata = await musicMetadata.parseBuffer(buffer);
        console.log('Metadata parsed successfully:', {
            title: metadata.common.title || fileName,
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album,
            year: metadata.common.year,
            duration: metadata.format.duration
        });
        return metadata;
    } catch (error) {
        console.error(`Error loading metadata for ${fileName}:`, error);
        return null;
    }
}

async function testMetadataLoading() {
    console.log('Testing Azure Storage connection and metadata loading...');
    
    try {
        // Connect to Azure
        console.log('Connecting to Azure Storage...');
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        console.log('Connected successfully');
        
        // List first 5 music files
        console.log('\nListing first 5 music files...');
        let count = 0;
        for await (const blob of containerClient.listBlobsFlat()) {
            if (count >= 5) break;
            if (blob.name.match(/\.(mp3|flac|wav|m4a)$/i)) {
                console.log(`\nProcessing file ${count + 1}: ${blob.name}`);
                const blobClient = containerClient.getBlobClient(blob.name);
                await loadMetadata(blobClient, blob.name);
                count++;
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

console.log('Starting metadata loading test...');
testMetadataLoading().then(() => console.log('Test complete'));
