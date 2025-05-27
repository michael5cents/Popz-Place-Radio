# Popz Place Radio 🎸

A professional web-based music player optimized for Samsung Z Fold3 that streams music from Azure Blob Storage. Features a sleek neon-themed interface with essential controls and expandable functionality.

## 🌟 Current Version: 1.1.0

**Live App**: https://popz-place-radio.azurewebsites.net
**GitHub**: https://github.com/michael5cents/Popz-Place-Radio

## ✨ Key Features

### 🎵 Core Functionality
- **Azure Blob Storage Integration**: Stream music directly from cloud storage
- **Smart Shuffle Mode**: History tracking prevents immediate repeats
- **Favorites System**: Persistent storage of favorite tracks
- **Progress Control**: Interactive progress bar with seeking capability
- **Volume Memory**: Remembers volume settings between sessions

### 📱 Mobile Optimizations (Samsung Z Fold3)
- **Essential Controls Layout**: 5 core buttons (prev, play, next, shuffle, favorite)
- **Expandable Interface**: "More Controls" button reveals additional features
- **Perfect Landscape Fit**: No scrolling required in folded position
- **Wake Lock Support**: Prevents audio interruption during device sleep
- **Touch-Optimized**: 36px buttons with proper spacing

### 🎨 User Experience
- **Neon Theme**: Dancing Script font with animated purple glow effects
- **Responsive Design**: Optimized for mobile and desktop
- **Smooth Animations**: Slide-down animations for expandable controls
- **Error Recovery**: Automatic retry logic for failed track loads
- **Version Display**: Info button shows current version

## 🏗️ Technical Architecture

### Frontend Stack
- **HTML5**: Semantic structure with mobile-first design
- **CSS3**: Grid layouts, animations, responsive breakpoints
- **Vanilla JavaScript**: ES6+ modules, async/await patterns
- **Vite**: Build tool for production optimization

### Backend Stack
- **Node.js 18.20.8**: Runtime environment
- **Express 5.1.0**: Web framework with static file serving
- **Azure SDK**: @azure/storage-blob for cloud integration
- **Environment Config**: dotenv for secure configuration

### Cloud Infrastructure
- **Azure Blob Storage**: Music file storage and streaming
- **Azure App Service**: Web application hosting
- **SAS URLs**: Secure access to audio files
- **Auto-scaling**: Handles traffic variations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Azure Storage Account with blob container
- Git for version control

### Installation
```bash
# Clone repository
git clone https://github.com/michael5cents/Popz-Place-Radio.git
cd Popz-Place-Radio

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Azure credentials

# Start development server
npm start
```

### Environment Variables
```env
VITE_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
VITE_AZURE_STORAGE_ACCESS_KEY=your_access_key
VITE_AZURE_STORAGE_ACCOUNT=your_account_name
VITE_AZURE_STORAGE_CONTAINER_NAME=music
PORT=3000
NODE_ENV=development
```

## 📚 Documentation

- **[TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)**: Detailed technical documentation
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: Complete deployment instructions
- **[BACKUP_STRATEGY.md](./BACKUP_STRATEGY.md)**: Backup and recovery procedures
- **[IMPROVEMENT_ROADMAP.md](./IMPROVEMENT_ROADMAP.md)**: Future enhancement suggestions
- **[USER_GUIDE.md](./USER_GUIDE.md)**: End-user instructions
- **[CHANGELOG.md](./CHANGELOG.md)**: Version history and changes

## 🔧 Development

### Build Commands
```bash
npm start          # Development server
npm run build      # Production build
npm run serve      # Preview production build
```

### Testing
```bash
node test-connection.mjs    # Test Azure connection
node test-metadata.mjs     # Test metadata extraction
```

## 🛡️ Security & Backup

- **Environment Variables**: Sensitive data stored securely
- **SAS URLs**: Time-limited access to audio files
- **HTTPS Only**: Secure communication in production
- **Regular Backups**: Automated GitHub and Azure backups

## 📈 Performance

- **Optimized Bundle**: Vite build optimization
- **Lazy Loading**: On-demand resource loading
- **Caching**: Browser and CDN caching strategies
- **Mobile First**: Optimized for mobile performance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

All rights reserved. © 2025 Michael Nichols

## 🙏 Acknowledgments

- **Azure Team**: For excellent cloud storage services
- **Vite Team**: For the amazing build tool
- **Font Awesome**: For beautiful icons
- **Google Fonts**: For the Dancing Script font
