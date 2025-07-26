#!/bin/bash

echo "📊 ClickHouse Ad Analytics Monitor"
echo "================================="

# Function to run ClickHouse queries
query() {
    docker exec clickhouse-server clickhouse client --password password123 --query="$1"
}

# Basic stats
echo
echo "📈 Basic Statistics:"
echo "-------------------"
echo "Total Impressions: $(query "SELECT count() FROM ad_analytics.impressions_local")"
echo "Last Hour: $(query "SELECT count() FROM ad_analytics.impressions_local WHERE timestamp >= now() - INTERVAL 1 HOUR")"
echo "Unique Campaigns: $(query "SELECT uniq(campaign_id) FROM ad_analytics.impressions_local")"
echo "Unique Ads: $(query "SELECT uniq(ad_id) FROM ad_analytics.impressions_local")"

# Recent impressions
echo
echo "🕐 Recent Impressions (Last 5):"
echo "-------------------------------"
query "SELECT timestamp, device_type, location, browser, gender, age FROM ad_analytics.impressions_local ORDER BY timestamp DESC LIMIT 5"

# Device breakdown
echo
echo "📱 Device Type Distribution:"
echo "---------------------------"
query "SELECT device_type, count() as impressions FROM ad_analytics.impressions_local WHERE timestamp >= now() - INTERVAL 1 HOUR GROUP BY device_type ORDER BY impressions DESC"

echo
echo "🔄 Run this script periodically to monitor your data pipeline!"
echo "💡 For auto-refresh: './auto-monitor.sh' or './auto-monitor.sh 3' (every 3s)"