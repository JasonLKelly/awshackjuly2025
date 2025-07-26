# Agent UX - Setup Instructions

## Prerequisites

- Node.js 18+ 
- AWS Account with Bedrock access
- AWS credentials configured

## Backend Setup

1. Navigate to backend directory:
```bash
cd agent-ux/backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file and configure:
```bash
cp .env.example .env
```

4. Edit `.env` to set your AWS region and model:
```
AWS_REGION=us-east-1
PORT=3002
ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0
```

**Note**: The app will automatically use your existing AWS CLI credentials. No need to set access keys in the .env file.

5. Start the backend server:
```bash
npm run dev
```

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd agent-ux/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend:
```bash
npm start
```

The app will be available at http://localhost:8002

## AWS Bedrock Configuration

Make sure Claude 3.5 Sonnet is enabled in your AWS Bedrock console for the region you're using.

Model ID used: `anthropic.claude-3-5-sonnet-20241022-v2:0`