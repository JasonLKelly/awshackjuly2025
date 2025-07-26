#!/bin/bash

echo "🚀 Setting up ClickHouse for Ad Analytics..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📦 Starting ClickHouse container..."
docker-compose up -d clickhouse

echo "⏳ Waiting for ClickHouse to be ready..."
sleep 10

# Wait for ClickHouse to be healthy
echo "🔍 Checking ClickHouse health..."
for i in {1..30}; do
    if curl -s http://localhost:8123/ping > /dev/null 2>&1; then
        echo "✅ ClickHouse is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ ClickHouse failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

echo "🗄️  Creating database and tables..."
cat setup-clickhouse.sql | curl -X POST 'http://localhost:8123/' --data-binary @-

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete!"
else
    echo "❌ Database setup failed"
    exit 1
fi

echo "🎉 Setup complete! ClickHouse is running on:"
echo "   - HTTP interface: http://localhost:8123"
echo "   - Native client: localhost:9000"
echo ""
echo "📊 Test queries:"
echo "   curl 'http://localhost:8123/?query=SELECT%20version()'"
echo "   curl 'http://localhost:8123/?query=SHOW%20DATABASES'"
echo ""
echo "🔥 Start generating impressions in your React app (Test Mode OFF)"
echo "📈 Then check: curl 'http://localhost:8123/?query=SELECT%20count()%20FROM%20ad_analytics.impressions_local'"