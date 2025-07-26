# Ad Viewer Simulator

A high-scale ad impression simulator built with React and Express. Generates configurable ad impressions and publishes them to Confluent Cloud Kafka.

## Features

- **Configurable impression generation** with adjustable rates (impressions per second)
- **Weighted parameter selection** for realistic ad targeting simulation
- **Real-time logging** with session tracking
- **Test mode** for local development without Kafka publishing
- **Proxy server** to handle CORS issues with Confluent Cloud

## Architecture

- **Frontend**: React app for configuration and real-time monitoring
- **Backend**: Express proxy server for Kafka API communication
- **Data**: Publishes to Confluent Cloud Kafka topic `impressions`

## Setup and Usage

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Services
```bash
npm run dev
```

This will start:
- Proxy server on `http://localhost:3001`
- React app on `http://localhost:3000`

### 3. Manual Startup (Alternative)
```bash
# Terminal 1: Start proxy server
npm run proxy

# Terminal 2: Start React app
npm start
```

## Configuration

### Impression Parameters
- **Impressions per Second**: Rate of impression generation
- **Test Mode**: Toggle between local logging and Kafka publishing
- **Parameter Weights**: Adjust probability distributions for:
  - Device Type (mobile, desktop, tablet)
  - Gender (male, female, other)
  - Browser (Chrome, Firefox, Safari, Edge)
  - Location (New York, Los Angeles, Chicago, Houston, Other)
  - Age Range (configurable min/max)

### Generated Data Structure
Each impression contains:
```json
{
  "adId": "uuid",
  "campaignId": "uuid", 
  "creativeId": "uuid",
  "timestamp": "ISO 8601",
  "deviceType": "mobile|desktop|tablet",
  "location": "string",
  "browser": "Chrome|Firefox|Safari|Edge",
  "gender": "male|female|other",
  "age": "integer"
}
```

## API Endpoints

### Proxy Server
- `GET /health` - Health check
- `POST /api/impressions` - Publish impression to Kafka

### Kafka Integration
Data is published to Confluent Cloud topic `impressions` with the format:
```json
{
  "value": {
    "type": "JSON",
    "data": "{stringified impression object}"
  }
}
```

## Development

- **Frontend**: Standard React development with hot reload
- **Backend**: Express server with CORS enabled for local development
- **Logging**: Console logging for debugging and monitoring