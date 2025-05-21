import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

// Azure Storage configuration
// Replace these with your actual Azure Storage credentials
const connectionString = 'YOUR_AZURE_STORAGE_CONNECTION_STRING';
const accessKey = 'YOUR_AZURE_STORAGE_ACCESS_KEY';
const accountName = 'YOUR_AZURE_STORAGE_ACCOUNT_NAME';
const containerName = 'YOUR_CONTAINER_NAME';

async function testConnection() {
    console.log('Testing Azure Storage connection...');
    
    try {
        // Try connection string first
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        console.log('Connected using connection string');
        
        const containerClient = blobServiceClient.getContainerClient(containerName);
        console.log(`Getting container client for "${containerName}"`);
        
        // List all blobs in the container
        let blobs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            blobs.push(blob.name);
        }
        
        console.log(`Found ${blobs.length} files in container:`);
        blobs.forEach(blob => console.log(`- ${blob}`));
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
        
        // Try with access key as fallback
        try {
            console.log('\nTrying with access key...');
            const credentials = new StorageSharedKeyCredential(accountName, accessKey);
            const blobServiceUrl = `https://${accountName}.blob.core.windows.net`;
            const blobServiceClient = new BlobServiceClient(blobServiceUrl, credentials);
            
            const containerClient = blobServiceClient.getContainerClient(containerName);
            console.log(`Getting container client for "${containerName}"`);
            
            // List all blobs in the container
            let blobs = [];
            for await (const blob of containerClient.listBlobsFlat()) {
                blobs.push(blob.name);
            }
            
            console.log(`Found ${blobs.length} files in container:`);
            blobs.forEach(blob => console.log(`- ${blob}`));
            
        } catch (fallbackError) {
            console.error('Fallback error:', fallbackError.message);
            console.error('Full fallback error:', fallbackError);
        }
    }
}

testConnection().catch(console.error);
