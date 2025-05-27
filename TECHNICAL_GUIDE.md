# Technical Guide - Popz Place Radio

## 🏗️ Architecture Overview

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Express API   │    │  Azure Storage  │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Music Files) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **HTML5**: Semantic markup with mobile-first approach
- **CSS3**: Grid layouts, flexbox, animations, media queries
- **JavaScript ES6+**: Modules, async/await, classes
- **Web APIs**: Wake Lock, Audio, Fetch, LocalStorage

#### Backend
- **Node.js 18.20.8**: JavaScript runtime
- **Express 5.1.0**: Web framework
- **Azure SDK**: @azure/storage-blob v12.27.0
- **Environment**: dotenv for configuration

#### Build Tools
- **Vite 4.4.9**: Fast build tool and dev server
- **PostCSS**: CSS processing
- **ESBuild**: JavaScript bundling

## 📁 Project Structure

```
popz-place-radio/
├── index.html              # Main HTML file
├── player.js               # Core JavaScript logic
├── server.js               # Express server
├── package.json            # Dependencies and scripts
├── vite.config.js          # Build configuration
├── web.config              # Azure deployment config
├── .env.example            # Environment template
├── dist/                   # Production build output
├── docs/                   # Documentation files
└── tests/                  # Test files
    ├── test-connection.mjs
    └── test-metadata.mjs
```

## 🔧 Core Components

### 1. Audio Player Engine (`player.js`)

#### Key Classes and Functions
```javascript
// Core player state
let tracks = [];
let currentTrack = null;
let isPlaying = false;
let shuffleHistory = [];

// Essential functions
async function playTrack(filename, retryCount = 0)
async function playNext()
async function playPrev()
function togglePlay()
function shufflePlaylist()
```

#### Mobile Optimizations
- **Wake Lock API**: Prevents device sleep during playback
- **Visibility Change Handling**: Maintains audio during app backgrounding
- **Touch Event Optimization**: Proper touch targets and gestures
- **Error Recovery**: Automatic retry with exponential backoff

### 2. Azure Integration (`server.js`)

#### API Endpoints
```javascript
GET /api/tracks           # List all music files
GET /api/getsasurl/:file  # Get secure access URL
GET /api/version          # Application version info
```

#### Security Features
- **SAS URLs**: Time-limited access tokens
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Sensitive data protection

### 3. UI Components

#### Essential Controls Layout
```css
.controls {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
}
```

#### Expandable Interface
```javascript
function toggleExtendedControls() {
    const isVisible = controlsExtended.classList.contains('show');
    // Toggle with smooth animation
}
```

## 📱 Mobile Optimizations

### Samsung Z Fold3 Specific
```css
@media (max-width: 768px) and (orientation: landscape) {
    .control-button {
        width: 36px;
        height: 36px;
        font-size: 0.8em;
    }
    
    .player {
        max-height: 88vh;
        padding: 12px;
    }
}
```

### Wake Lock Implementation
```javascript
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
    }
}
```

## 🔄 Data Flow

### 1. Application Startup
```
1. Load HTML → 2. Initialize JS → 3. Connect Azure → 4. Load Tracks
```

### 2. Track Playback
```
1. User clicks play → 2. Request SAS URL → 3. Load audio → 4. Start playback
```

### 3. Shuffle Mode
```
1. Enable shuffle → 2. Track history → 3. Select random → 4. Avoid repeats
```

## 🛠️ Development Workflow

### Local Development
```bash
# Start development server
npm start

# Build for production
npm run build

# Preview production build
npm run serve
```

### Environment Setup
```env
# Required variables
VITE_AZURE_STORAGE_CONNECTION_STRING=...
VITE_AZURE_STORAGE_ACCESS_KEY=...
VITE_AZURE_STORAGE_ACCOUNT=...
VITE_AZURE_STORAGE_CONTAINER_NAME=music
PORT=3000
NODE_ENV=development
```

### Testing
```bash
# Test Azure connection
node test-connection.mjs

# Test metadata extraction
node test-metadata.mjs
```

## 🔍 Debugging

### Common Issues
1. **Audio not playing**: Check SAS URL generation
2. **Mobile sleep interruption**: Verify wake lock support
3. **Shuffle repeats**: Check history tracking logic
4. **Layout issues**: Verify CSS media queries

### Debug Tools
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check wake lock status
console.log('Wake lock:', wakeLock?.released);

// Monitor shuffle history
console.log('Shuffle history:', shuffleHistory);
```

## 📊 Performance Monitoring

### Key Metrics
- **Audio load time**: < 2 seconds
- **UI responsiveness**: < 100ms interactions
- **Memory usage**: < 50MB baseline
- **Bundle size**: < 15KB gzipped

### Optimization Techniques
- **Lazy loading**: Load tracks on demand
- **Caching**: Browser and service worker caching
- **Compression**: Gzip/Brotli compression
- **Minification**: CSS/JS optimization

## 🔐 Security Considerations

### Data Protection
- **Environment variables**: Never commit secrets
- **SAS URLs**: Time-limited access (1 hour)
- **HTTPS only**: Secure communication
- **Input validation**: Sanitize user inputs

### Best Practices
- Regular dependency updates
- Security headers implementation
- Access logging and monitoring
- Regular security audits
