declare global {
  interface Window {
    google: typeof google;
    GOOGLE_MAPS_API_KEY: string;
  }
}

export {};
