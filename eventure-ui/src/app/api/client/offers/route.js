// // src/app/api/client/offers/route.js
// import { proxyRequest } from '@/lib/bff/proxy';

// export async function GET(req) {
//   const base = process.env.PROVIDERS_SERVICE_BASE_URL;
//   const url = new URL(req.url);
//   const qs = url.search || '';

//   // În providers-service trebuie o rută GET /client/offers
//   // care să accepte query-uri: eventType, categoryId, subcategoryId,
//   // q, budgetMin, budgetMax, location, page, pageSize etc.
//   return proxyRequest(req, base, '/v1/client/offers');
// }
