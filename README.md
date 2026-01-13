<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1F_lItjZ3xAJDKYcNC2ao2OdYwu-u31oB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (it is embedded at build time)
3. Run the app:
   `npm run dev`

## Deploy with EasyPanel

1. Create a new **Docker** service in EasyPanel and point it at this repository.
2. Ensure the environment variable `VITE_GEMINI_API_KEY` is set in the service settings.
3. Allow outbound access to `https://esm.sh` and Gemini APIs so receipt scanning can load the SDK at runtime.
4. Build and deploy. The container exposes port **80** and serves the Vite build via Nginx.
