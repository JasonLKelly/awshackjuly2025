# Ad Optimization Agent

Today, when brand advertisers try to optimize their campaigns, they're stuck with a ton of manual work.  

## Components

### Ad Viewer Simulator

A high-scale ad impression simulator. It's a front-end-only web app that can run from localhost. Given a set of ad impression parameters, it creates a random sample of ad impressions. Each simulated impression is sent to a URL with query parameters describing the impression.

Impression information:

| paramName         | description                                      |
|-------------------|--------------------------------------------------|
| adId              | Unique identifier for the ad                     |
| campaignId        | Identifier for the ad campaign                   |
| creativeId        | Unique identifier for the creative used          |
| creativeName      | Filename of the creative asset (e.g., c1.png)   |
| timestamp         | Time of the impression (ISO 8601 format)         |
| deviceType        | Type of device (e.g., mobile, desktop)           |
| location          | Geographic location of the viewer                |
| browser           | Browser used by the viewer                       |
| gender            | Gender of the ad viewer                          |
| age               | Age of the ad viewer                             |

Parameters:

* number of impressions per second
* impression collector URL (e.g. https://localhost:3000/ingest)
* values and weighting for each parameter.  
    - allowable values (set of strings or int range)
    - parameter values are selected randomly
    - for set of strings parameters, the probability of each one can be adjusted.  For example, male: 60%, female: 40%
* **Creative Assets**: Creative files (PNG, JPG, GIF) with probability weights
    - Files automatically detected from `./shared/` directory
    - Each creative has adjustable probability percentage
    - New files automatically added to configuration
* Test Mode: logs the impression in the local web app, but does not make the API call.

Operation:
* User configures the params above
* User clicks Start
* App starts sending simulated impressions to the url.   each parameter is sent as a query string parameter on the URL.  If Test Mode is on, the URL request is not sent
* The webapp shows a log of all impressions being sent.  
* The webapp shows a total count of impressions sent in this session.  When the user clicks Start, the impression count is reset to 0.

### Impression Collector

* Confluence Cloud instance 
* It provides a Kafka instance with a URL to give to the simulator.
* Data is streamed into a ClickHouse database.

### ClickHouse Database

### Optimization Agent

I want to implement an agent that asks for data about an ad campaign, and then continually looks for   It should be able to do a conversation like this:

Agent: Hi, I'm Rokko! I can help you optimize your ad campaign. Can you tell me a bit about your campaign?  First, What's the campaign name?

User: Oreo Q3 2025

Agent: Thanks. What is the most valuable target audience?

User: Women age 35-50.

Agent: Great. I'll start watching the campaign and report back to you on how it's doing.

[1 minutes later]

Agent: 🔔 Hey, your campaign is underperforming with Women age 35-50.    Let's try something to improve it!  I could increase spending on this demographic.  Want to do it?

User: Yes.

Agent: OK, I've made that change. I'll monitor the ad performance and let you know how it's going.

## Campaign Configuration Storage

The system uses a shared JSON configuration file approach to coordinate between all components:

### Configuration File Structure
**Location**: `./shared/campaign-config.json`

```json
{
  "campaignId": "oreo-q3-2025",
  "campaignName": "Oreo Q3 2025",
  "targetAudience": "Women age 35-50",
  "impressionsPerSecond": 5,
  "testMode": false,
  "parameters": {
    "deviceType": { "mobile": 60, "desktop": 30, "tablet": 10 },
    "location": { "New York": 25, "Los Angeles": 20, "Chicago": 15, "Houston": 10, "Other": 30 },
    "browser": { "Chrome": 60, "Firefox": 20, "Safari": 15, "Edge": 5 },
    "gender": { "male": 25, "female": 70, "other": 5 },
    "age": { "min": 35, "max": 50 },
    "creatives": { "c1.png": 54, "c2.png": 23, "c3.png": 23 }
  },
  "lastUpdatedBy": "temporal-workflow",
  "lastUpdated": "2025-01-20T10:30:00Z",
  "version": 1
}
```

### Component Integration

**Agent UX**: 
- Writes initial campaign configuration after collecting user input
- Updates config when user approves optimization changes

**Temporal Workflows**:
- Activities read current config for performance analysis
- Activities write optimized parameters (e.g., adjust gender weighting)
- Uses atomic file writes to prevent corruption

**Ad Simulator**:
- **Config Server**: Runs Express API server on port 3003 to serve and update shared config
- **Real-time Loading**: Polls config API every 2 seconds to detect changes
- **Live Updates**: Automatically applies new parameters to running simulations without restart
- **Full Editing**: Users can edit all config parameters in the web UI
- **Creative Management**: Automatically detects creative files and manages probability weights
- **Bidirectional Sync**: Changes can be saved from the UI back to the shared file
- **Visual Indicators**: Shows connection status (🔗 shared vs 📁 local config)

### Implementation Details

**Config Server** (`config-server.js`):
- GET `/api/campaign-config` - Returns current configuration with auto-detected creative files
- POST `/api/campaign-config` - Updates configuration with atomic writes
- **Creative File Detection**: Automatically scans `/shared` directory for image files (PNG, JPG, GIF)
- **Smart Merging**: Preserves existing creative probabilities, assigns defaults to new files
- Increments version number on each update
- Uses temp file + rename for atomic updates

**Web Application**:
- Polls config server every 2 seconds for updates
- Automatically restarts simulation with new rates when config changes
- **Creative UI**: Displays all detected creative files with editable probability inputs
- **Dynamic Updates**: New creative files appear automatically in the UI
- Refresh button for manual config reload
- Save button to persist local changes to shared file
- All form inputs remain editable when using shared config

**Startup**: Run `npm run dev` to start proxy server, config server, and React app simultaneously

### File Update Protocol
1. **Read**: Components fetch config via HTTP API or direct file access
2. **Write**: Use atomic writes (`writeFileSync` with temp file + rename)
3. **Poll**: Ad-simulator polls API every 2 seconds for changes
4. **Version**: Increment version number on each update to detect changes
5. **Live Apply**: Running simulations automatically update their behavior

This approach provides real-time configuration updates with zero infrastructure overhead, perfect for local development and hackathon scenarios.