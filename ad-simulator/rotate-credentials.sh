#!/bin/bash

# Script to rotate Confluent Cloud credentials
# Usage: ./rotate-credentials.sh NEW_API_KEY NEW_API_SECRET

if [ $# -ne 2 ]; then
    echo "Usage: $0 NEW_API_KEY NEW_API_SECRET"
    echo "Example: $0 ABCD1234 your-new-secret-key"
    exit 1
fi

NEW_API_KEY="$1"
NEW_API_SECRET="$2"
OLD_API_KEY="W5TTQNWWTE6734DY"
OLD_API_SECRET="RShgMCy/V++wWlWc2XTc/7hoY7KAP2t7Lh8tglZt6IFwg2/Ly1k7jnjWkgbwrp+6"

# Create new base64 encoded credential
NEW_BASE64=$(echo -n "$NEW_API_KEY:$NEW_API_SECRET" | base64)
OLD_BASE64="VzVUVFFOV1dURTY3MzREWTpSU2hnTUN5L1YrK3dXbFdjMlhUYy83aG9ZN0tBUDJ0N0xoOHRnbFp0NklGd2cyL0x5MWs3am5qV2tnYndycCs2"

echo "🔄 Rotating Confluent Cloud credentials..."
echo "📝 Old API Key: $OLD_API_KEY"
echo "📝 New API Key: $NEW_API_KEY"
echo "🔐 New Base64: $NEW_BASE64"

# Update proxy-server.js (base64 credential)
if [ -f "proxy-server.js" ]; then
    echo "✅ Updating proxy-server.js..."
    sed -i '' "s/$OLD_BASE64/$NEW_BASE64/g" proxy-server.js
fi

# Update ClickHouse SQL files (individual credentials)
for file in *.sql; do
    if [ -f "$file" ] && grep -q "$OLD_API_KEY" "$file"; then
        echo "✅ Updating $file..."
        sed -i '' "s/$OLD_API_KEY/$NEW_API_KEY/g" "$file"
        sed -i '' "s|$OLD_API_SECRET|$NEW_API_SECRET|g" "$file"
    fi
done

echo "🎉 Credential rotation complete!"
echo "⚠️  IMPORTANT: Delete old API key from Confluent Cloud console"
echo "🔒 IMPORTANT: Restart all services (proxy, ClickHouse) to use new credentials"