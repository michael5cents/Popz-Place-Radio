# Popz Place Radio 🎸

A web-based music player that brings back the magic of vinyl records in the digital age. Stream your favorite 70s classics with the authentic feel of vinyl playback.

## Features

### Core Features
- **Full Vinyl Side Playback**: Experience albums as they were meant to be heard
- **Single Track Selection**: Choose individual tracks when you're in a hurry
- **Shuffle Mode**: Randomize your musical journey with smart playback
- **Favorites System**: Create your personal collection of beloved tracks

### Player Controls
- Play/Pause, Next/Previous track navigation
- Interactive progress bar for precise track navigation
- Volume control with memory feature
- Mute/Unmute functionality

### User Experience
- Modern, intuitive interface
- Responsive design
- Persistent user preferences
- Real-time track information

## Technical Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express
- **Storage**: Azure Blob Storage
- **Deployment**: Azure App Service

## Dependencies
- @azure/storage-blob: ^12.27.0
- dotenv: ^16.3.1
- express: ^5.1.0
- music-metadata-browser: ^2.5.10
- vite: ^4.4.9

## Installation

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables in `.env`:
```
VITE_AZURE_STORAGE_CONNECTION_STRING=your_connection_string
VITE_AZURE_STORAGE_ACCESS_KEY=your_access_key
VITE_AZURE_STORAGE_ACCOUNT=your_account_name
VITE_AZURE_STORAGE_CONTAINER_NAME=your_container_name
PORT=3000
```

4. Run development server
```bash
npm run dev
```

## Production Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Documentation
- [User Guide](./USER_GUIDE.md): Complete guide for end users
- [Azure Setup](./AZURE_SETUP.md): Azure storage configuration
- [Deployment Guide](./DEPLOYMENT.md): Deployment instructions

## License
All rights reserved. © 2025

## Acknowledgments
Special thanks to all the music lovers who inspired this project! 🎵✨
