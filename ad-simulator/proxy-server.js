const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Load credentials from environment variables
const CONFLUENT_API_KEY = process.env.CONFLUENT_API_KEY;
const CONFLUENT_API_SECRET = process.env.CONFLUENT_API_SECRET;
const KAFKA_CLUSTER_ID = process.env.KAFKA_CLUSTER_ID || 'lkc-mm77nx';

if (!CONFLUENT_API_KEY || !CONFLUENT_API_SECRET) {
  console.error('❌ Missing required environment variables:');
  console.error('   CONFLUENT_API_KEY and CONFLUENT_API_SECRET must be set');
  console.error('   Make sure .env file exists with your credentials');
  process.exit(1);
}

// Build Kafka configuration from environment
const KAFKA_CONFIG = {
  url: `https://pkc-rgm37.us-west-2.aws.confluent.cloud:443/kafka/v3/clusters/${KAFKA_CLUSTER_ID}/topics/impressions/records`,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(`${CONFLUENT_API_KEY}:${CONFLUENT_API_SECRET}`).toString('base64')
  }
};

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Proxy server is running', 
    timestamp: new Date().toISOString(),
    kafka_cluster: KAFKA_CLUSTER_ID,
    api_key_preview: CONFLUENT_API_KEY.substring(0, 4) + '****'
  });
});

// Proxy endpoint for Kafka impressions
app.post('/api/impressions', async (req, res) => {
  try {
    console.log('Received impression data:', JSON.stringify(req.body, null, 2));
    
    const payload = {
      value: {
        type: 'JSON',
        data: JSON.stringify(req.body)
      }
    };
    
    console.log('Sending to Kafka:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(KAFKA_CONFIG.url, {
      method: 'POST',
      headers: KAFKA_CONFIG.headers,
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('Kafka response status:', response.status);
    console.log('Kafka response:', responseText);
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Kafka API error', 
        status: response.status,
        message: responseText 
      });
    }
    
    const result = JSON.parse(responseText);
    res.json({ 
      success: true, 
      kafka_response: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Impressions endpoint: http://localhost:${PORT}/api/impressions`);
});