# Companion App NextJS Starter Code

This project is a demonstration of building a companion app using [Mem0](https://mem0.dev/home-ncs) for memory management and [OpenRouter](https://openrouter.ai/) for accessing Large Language Models (LLMs).

## Features

- Interactive chat interface with a customizable personal AI companion
- Memory management for both user and agent using Mem0 API
- LLM integration via OpenRouter API
- Real-time memory display and refresh

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Mem0 and OpenRouter API keys in the settings panel
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result

## Key Components

- `page.js`: Main chat interface and logic
- `settings-panel.js`: Settings management for API keys and companion customization
- `memories-panel.js`: Display and management of user and agent memories

## Troubleshooting

If you encounter issues:

1. Verify API keys are correct and have necessary permissions.
2. Check your internet connection.
3. For persistent problems, inspect the browser console for error messages.
4. Try refreshing the page or restarting the application.

## Learn More

- [Mem0 Documentation](https://mem0.dev/docs-ncs)
- [OpenRouter Documentation](https://openrouter.ai/docs)

## Deployment

This Next.js app can be easily deployed on platforms like Vercel. Make sure to set up your environment variables for API keys securely.
