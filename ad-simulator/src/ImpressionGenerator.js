function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getWeightedRandomValue(weights) {
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [value, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return value;
    }
  }
  
  return Object.keys(weights)[0];
}

function getRandomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateImpression(parameters) {
  return {
    adId: generateUUID(),
    campaignId: generateUUID(),
    creativeId: generateUUID(),
    creativeName: parameters.creatives ? getWeightedRandomValue(parameters.creatives) : 'default.png',
    timestamp: new Date().toISOString(),
    deviceType: getWeightedRandomValue(parameters.deviceType),
    location: getWeightedRandomValue(parameters.location),
    browser: getWeightedRandomValue(parameters.browser),
    gender: getWeightedRandomValue(parameters.gender),
    age: getRandomIntInRange(parameters.age.min, parameters.age.max)
  };
}