const PROXY_CONFIG = {
  url: 'http://localhost:3001/api/impressions',
  headers: {
    'Content-Type': 'application/json'
  }
};

export async function publishToKafka(impression) {
  try {
    console.log('Publishing impression via proxy:', impression);

    const response = await fetch(PROXY_CONFIG.url, {
      method: 'POST',
      headers: PROXY_CONFIG.headers,
      body: JSON.stringify(impression)
    });

    console.log('Proxy response status:', response.status);

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error('Proxy error response:', errorResponse);
      throw new Error(`HTTP ${response.status}: ${errorResponse.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Proxy success response:', result);
    return result;
  } catch (error) {
    console.error('Failed to publish impression via proxy:', error);
    throw error;
  }
}