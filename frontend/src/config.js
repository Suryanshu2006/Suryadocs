// Dynamic API URL resolving for seamless local/production deployment.
// If VITE_API_URL is set (e.g., in Vercel), it uses that.
// If running dev server locally, it uses localhost.
// Otherwise it falls back to the backend deployed on Render.
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001' : 'https://suryadocs.onrender.com');
