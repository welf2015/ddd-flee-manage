# Mapbox Setup Guide

This project uses Mapbox for address autocomplete and map visualization.

## 1. Get a Mapbox Access Token

1.  Go to [mapbox.com](https://www.mapbox.com/) and sign up or log in.
2.  Navigate to your **Account** dashboard.
3.  Copy your **Default Public Token** (starts with `pk.`).

## 2. Configure the Token

1.  Open `components/create-booking-dialog.tsx`.
2.  Find the `MAPBOX_TOKEN` constant at the top of the file.
3.  Replace the placeholder string with your actual Mapbox Access Token.

```typescript
const MAPBOX_TOKEN = "pk.eyJ1Ijoi..." // Your token here
```

## 3. (Optional) Restrict Your Token

For security, it is recommended to restrict your token to your domain in the Mapbox dashboard settings.
