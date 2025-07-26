# Ad Viewer Simulator - V1 Implementation Plan

A high-scale ad impression simulator built as a front-end-only React web app.

## Component Architecture

### Core Components
- **App.js** - Main container component managing global state
- **ConfigPanel.js** - Configuration form for impression parameters
- **ImpressionLogger.js** - Display for impression logs and count
- **ImpressionGenerator.js** - Core logic for generating impressions

## Feature Implementation

### 1. Configuration Panel
- Impressions per second control (slider/input)
- Impression collector URL input field
- Parameter configuration for each impression field:
  - **String sets with probability weights**: gender, deviceType, browser, location
  - **Integer ranges**: age
  - **Auto-generated**: adId, campaignId, creativeId (UUIDs), timestamp
- Test mode toggle

### 2. Impression Generation Logic
- Timer-based impression creation using `setInterval`
- Random value selection based on configured weights/ranges
- UUID generation for unique identifiers
- ISO 8601 timestamp generation
- Query string parameter formatting for API calls

### 3. Logging Interface
- Real-time impression log display (scrollable list)
- Session impression counter (resets on Start)
- Start/Stop controls
- Clear log functionality

### 4. Data Flow
1. User configures parameters → ConfigPanel updates app state
2. User clicks Start → ImpressionGenerator begins interval timer
3. Each impression → logged to ImpressionLogger + optionally sent to collector URL
4. Test mode → impressions only logged locally, no API calls made

## Impression Parameters

| Parameter     | Type           | Description                          |
|---------------|----------------|--------------------------------------|
| adId          | UUID           | Unique identifier for the ad         |
| campaignId    | UUID           | Identifier for the ad campaign       |
| creativeId    | UUID           | Unique identifier for the creative   |
| timestamp     | ISO 8601       | Time of the impression               |
| deviceType    | String (enum)  | mobile, desktop, tablet              |
| location      | String (enum)  | Geographic location of viewer        |
| browser       | String (enum)  | Chrome, Firefox, Safari, Edge        |
| gender        | String (enum)  | male, female, other                  |
| age           | Integer range  | 18-65                                |

## Technical Details

### State Management
- React hooks (useState) for component state
- Lift state up to App component for shared data

### Impression Generation
- Configurable rate (impressions per second)
- Weighted random selection for categorical parameters
- Range-based random selection for numerical parameters

### API Integration
- GET requests with query parameters
- Error handling for failed requests
- Test mode bypass

### UI/UX
- Simple, functional design
- Real-time updates
- Responsive layout for desktop use