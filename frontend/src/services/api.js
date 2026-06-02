import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Challenge 02: Fetch analytics data (daily revenue + top products)
export const fetchAnalytics = () => api.get('/analytics/');

// Challenge 03: Fetch product list for POS
export const fetchProducts = () => api.get('/products/');

// Challenge 03: Submit checkout
export const submitCheckout = (cartPayload) => api.post('/checkout/', cartPayload);

// Challenge 01: Purchase (used by load test, exposed here for completeness)
export const purchaseProduct = (productId, quantity = 1) =>
  api.post('/purchase/', { product_id: productId, quantity });

export default api;
