# Changelog

All notable changes to Popz Place Radio will be documented in this file.

## [1.1.0] - 2025-01-27

### Added
- **Mobile Sleep Mode Support**: Implemented Screen Wake Lock API to prevent audio interruption when device goes to sleep
- **Enhanced Shuffle Mode**: Complete rewrite of shuffle logic with history tracking to prevent immediate repeats
- **Retry Logic**: Added automatic retry mechanism for failed track loads (up to 3 attempts)
- **Mobile Optimizations**: Added mobile-specific CSS, meta tags, and touch-friendly controls
- **Advanced Error Handling**: Comprehensive error handling for audio playback failures
- **Visibility Change Handling**: Proper handling of app focus/blur events on mobile devices
- **Audio Session Management**: Better audio session handling for mobile browsers
- **Volume Slider Styling**: Added proper CSS styling for volume control slider

### Fixed
- **Samsung Z Fold3 Sleep Issue**: Fixed sudden stopping of player when phone goes to sleep mode
- **Shuffle Mode EOF Errors**: Fixed errors when shuffle mode reaches end of playlist
- **Progress Bar Click Handler**: Fixed click event targeting for progress bar seeking
- **Mobile Touch Targets**: Improved touch target sizes for better mobile usability
- **Audio Interruption Recovery**: Better handling of audio interruptions from calls/notifications

### Improved
- **Shuffle Algorithm**: Smarter shuffle that avoids recent repeats using history tracking
- **Error Messages**: More descriptive error messages and user feedback
- **Console Logging**: Enhanced logging for debugging mobile audio issues
- **Mobile UI**: Responsive design improvements for mobile devices
- **Audio Event Handling**: More robust audio event listeners for better reliability

### Technical Changes
- Added wake lock variables and management functions
- Implemented shuffle history tracking system
- Enhanced playTrack() function with retry logic and better error handling
- Improved playNext() and playPrev() functions with comprehensive error handling
- Added mobile-specific event listeners for visibility and focus changes
- Enhanced audio event handlers for better mobile compatibility

## [1.0.0] - 2025-01-27

### Initial Release
- Web-based music player with vinyl-inspired design
- Azure Blob Storage integration for music streaming
- Full player controls (play/pause, next/prev, shuffle, stop)
- Favorites system with persistent storage
- Volume control with memory
- Track listing and selection
- Progress bar with seeking capability
- Responsive design with neon styling
