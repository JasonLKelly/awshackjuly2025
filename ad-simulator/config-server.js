const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3003;

// Path to the shared config file
const CONFIG_FILE_PATH = path.resolve(__dirname, '../shared/campaign-config.json');
const SHARED_DIR_PATH = path.resolve(__dirname, '../shared');

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to read config file
const readConfigFile = () => {
  try {
    const data = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config file:', error);
    throw error;
  }
};

// Helper function to scan for creative files
const scanCreativeFiles = () => {
  try {
    const files = fs.readdirSync(SHARED_DIR_PATH);
    return files.filter(file => 
      file.toLowerCase().endsWith('.png') || 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.gif')
    );
  } catch (error) {
    console.error('Error scanning creative files:', error);
    return [];
  }
};

// Helper function to update config with current creative files
const syncCreativeFiles = (config) => {
  const currentFiles = scanCreativeFiles();
  const existingCreatives = config.parameters?.creatives || {};
  
  // Create new creatives object
  const newCreatives = {};
  const totalExisting = Object.keys(existingCreatives).length;
  
  currentFiles.forEach((file, index) => {
    if (existingCreatives[file]) {
      // Keep existing probability
      newCreatives[file] = existingCreatives[file];
    } else {
      // Assign equal probability for new files
      const defaultProbability = totalExisting > 0 ? 10 : Math.floor(100 / currentFiles.length);
      newCreatives[file] = defaultProbability;
    }
  });
  
  return {
    ...config,
    // Ensure campaignName is preserved
    campaignName: config.campaignName || 'Unnamed Campaign',
    parameters: {
      ...config.parameters,
      creatives: newCreatives
    }
  };
};

// Helper function to write config file atomically
const writeConfigFile = (config) => {
  try {
    const tempFile = CONFIG_FILE_PATH + '.tmp';
    const syncedConfig = syncCreativeFiles(config);
    const updatedConfig = {
      ...syncedConfig,
      lastUpdated: new Date().toISOString(),
      version: (config.version || 0) + 1
    };
    
    fs.writeFileSync(tempFile, JSON.stringify(updatedConfig, null, 2));
    fs.renameSync(tempFile, CONFIG_FILE_PATH);
    
    return updatedConfig;
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
  }
};

// GET /api/campaign-config - Get current config
app.get('/api/campaign-config', (req, res) => {
  try {
    const config = readConfigFile();
    const syncedConfig = syncCreativeFiles(config);
    
    // If creative files changed, update the config file
    if (JSON.stringify(config.parameters?.creatives) !== JSON.stringify(syncedConfig.parameters?.creatives)) {
      const updatedConfig = writeConfigFile(syncedConfig);
      res.json(updatedConfig);
    } else {
      res.json(syncedConfig);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read config file' });
  }
});

// POST /api/campaign-config - Update config
app.post('/api/campaign-config', (req, res) => {
  try {
    const updatedConfig = {
      ...req.body,
      lastUpdatedBy: 'ad-simulator',
    };
    
    const savedConfig = writeConfigFile(updatedConfig);
    res.json(savedConfig);
    console.log('Config updated by ad-simulator:', savedConfig.version);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config file' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Config server running on http://localhost:${PORT}`);
  console.log(`Serving config from: ${CONFIG_FILE_PATH}`);
  
  // Check if config file exists
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    console.warn('Warning: Config file does not exist at', CONFIG_FILE_PATH);
  } else {
    console.log('Config file found and ready');
  }
});