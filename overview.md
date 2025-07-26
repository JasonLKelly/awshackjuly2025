# Ad Optimization Agent

Today, when brand advertisers try to optimize their campaigns, they're stuck with a ton of manual work. This system provides an integrated solution for ad campaign simulation, data collection, and optimization.

## System Architecture

The system consists of three main components that work together:

1. **Ad Simulator** (`ad-simulator/`) - React web app that generates ad impressions
2. **Agent UX** (`agent-ux/`) - Conversational interface for campaign setup and optimization  
3. **ClickHouse Database** - Docker container for data storage and analytics
4. **Kafka Integration** - Confluent Cloud for real-time data streaming

## Components

### Ad Viewer Simulator

A high-scale ad impression simulator built as a React web application. It generates realistic ad impressions based on configurable parameters and sends them to Kafka for processing.

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

### Kafka Integration (Confluent Cloud)

* Real-time streaming platform for impression data
* Receives impression events from the ad simulator via HTTP proxy
* Streams data into ClickHouse for analytics and optimization

### ClickHouse Database

* Dockerized analytics database for impression storage and querying
* Kafka consumer automatically ingests streaming impression data
* Supports real-time analytics for campaign optimization
* Accessible via HTTP interface on port 8123

### Agent UX (Rokko)

Rokko is a conversational AI agent that helps advertisers set up and optimize their campaigns through natural language interaction. The agent collects campaign details through a chat interface, including campaign name, target audience, budget, and goals. Once setup is complete, Rokko monitors campaign performance using real-time data from ClickHouse and proactively suggests optimizations based on performance metrics.

**Key Features:**
- **Campaign Setup**: Guides users through campaign configuration via conversation
- **Performance Monitoring**: Analyzes impression data to identify underperforming segments  
- **Optimization Suggestions**: Recommends parameter adjustments (audience targeting, creative weights, etc.)
- **Real-time Updates**: Applies approved changes to the shared campaign configuration
- **Data Integration**: Connects campaign setup with live impression analytics

**Example Interaction:**
```
Rokko: Hi, I'm Rokko! I can help you optimize your ad campaign. What's your campaign name?
User: Oreo Q3 2025
Rokko: Great! What's your most valuable target audience?
User: Women age 35-50
Rokko: Perfect. I'll monitor your campaign and suggest improvements based on performance data.

[Later, after analyzing data]
Rokko: 🔔 Your campaign is underperforming with women age 35-50. I suggest increasing their targeting weight from 70% to 85%. Approve this change?
```

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

## System Launch Instructions

### Prerequisites
- Node.js (v16+)
- Docker Desktop
- Confluent Cloud API credentials

### 1. Start ClickHouse Database
```bash
# Start ClickHouse container
docker run -d \
  --name clickhouse-server \
  -p 8123:8123 -p 9000:9000 \
  clickhouse/clickhouse-server:latest

# Initialize database schema
cd ad-simulator
docker exec -i clickhouse-server clickhouse-client --multiquery < setup-clickhouse.sql

# Update Kafka connection with your credentials
# Edit kafka-new-credentials.sql with your API key/secret, then run:
docker exec -i clickhouse-server clickhouse-client --multiquery < kafka-new-credentials.sql
```

### 2. Launch Ad Simulator
```bash
cd ad-simulator

# Create .env file with your Confluent Cloud credentials
cp .env.example .env
# Edit .env and add your CONFLUENT_API_KEY and CONFLUENT_API_SECRET

# Install dependencies and start all services
npm install
npm run dev
```

This starts:
- **Config Server** (port 3003) - Serves shared campaign configuration
- **Proxy Server** (port 3001) - Routes impressions to Kafka
- **React App** (port 3000) - Ad simulator web interface

### 3. Launch Agent UX
```bash
cd agent-ux/backend

# Create .env file with AWS credentials for Bedrock
cp .env.example .env
# Edit .env and add your AWS credentials

# Install and start backend
npm install
npm start   # Runs on port 3002

# In another terminal, start frontend
cd agent-ux/frontend
npm install
npm start   # Runs on port 3001 (or next available)
```

### 4. Verify System Operation

**Check ClickHouse Connection:**
```bash
# Verify impressions are being received
docker exec clickhouse-server clickhouse-client -q "SELECT count(*) FROM ad_analytics.impressions_local"
```

**Access Points:**
- Ad Simulator: http://localhost:3000
- Agent UX: http://localhost:3001 (or assigned port)
- ClickHouse: http://localhost:8123
- Config API: http://localhost:3003/api/campaign-config

### 5. Test Data Flow
1. Start impression generation in Ad Simulator
2. Verify data appears in ClickHouse
3. Use Agent UX to interact with campaign data
4. Observe real-time configuration updates between components