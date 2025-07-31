# Changelog

All notable changes to Popz Place Radio will be documented in this file.

## [1.3.0] - 2025-01-30

### Added
- **Server-Side Navigation Endpoints**: New `/api/first`, `/api/next/:track`, and `/api/prev/:track` endpoints for efficient sequential playback
- **Optimized Regular Playback**: Play/next/previous buttons now fetch only single track names instead of entire library
- **Smart Data Usage**: Eliminated unnecessary track list downloads for normal playback operations

### Fixed
- **Mobile Data Efficiency**: Reduced data usage by ~99% for regular play/next/previous operations
- **Large Library Performance**: Optimized for music collections with 800+ tracks on mobile devices
- **Cellular Network Optimization**: Perfect performance on limited data connections

### Changed
- **Play Button Logic**: Now uses `/api/first` endpoint instead of loading entire track list
- **Next/Previous Logic**: Uses server-side endpoints for sequential navigation
- **Show Tracks Button**: Only feature that loads full track list (when user specifically wants to browse)

### Technical Changes
- Added `/api/first` endpoint for getting first track without full library download
- Added `/api/next/:currentTrack` endpoint for sequential next track selection
- Added `/api/prev/:currentTrack` endpoint for sequential previous track selection
- Refactored client-side playback logic to use server-side navigation
- Maintained shuffle optimization from v1.2.0 while adding sequential optimizations

## [1.2.0] - 2025-01-30

### Added
- **Server-Side Shuffle Optimization**: New `/api/shuffle` endpoint handles randomization on the server to improve mobile performance
- **GitHub Actions Workflow**: Added automated CI/CD pipeline for Azure deployment
- **Mobile Performance Improvements**: Optimized for large music libraries (800+ tracks) on mobile devices

### Fixed
- **Mobile Buffering Issues**: Resolved buffering and stalling problems on cellular networks by reducing client-side data processing
- **Shuffle Performance**: Eliminated need to download entire track list for shuffle functionality
- **Large Library Support**: Improved performance for music collections with hundreds of tracks

### Changed
- **Shuffle Logic**: Moved from client-side to server-side processing for better mobile performance
- **Data Transfer**: Reduced mobile data usage by fetching one track at a time instead of entire playlist
- **Deployment Method**: Added support for both GitHub Actions and direct Azure git deployment

### Technical Changes
- Added `/api/shuffle` endpoint in server.js for server-side track randomization
- Refactored shuffle functionality in player.js to use server endpoint
- Removed client-side shuffle history tracking and array shuffling
- Updated package.json version to 1.2.0
- Added GitHub Actions workflow file for automated deployment

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
