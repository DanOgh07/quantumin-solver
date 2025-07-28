export {};

declare global {
  interface Window {
    env?: {
      HF_API_KEY?: string;
    };
  }
}
