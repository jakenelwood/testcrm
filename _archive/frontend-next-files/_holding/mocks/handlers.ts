import { rest } from 'msw';

// Example API handlers for testing
export const handlers = [
  // Example GET handler
  rest.get('/api/quotes', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', customer: 'John Doe', type: 'auto', status: 'pending' },
        { id: '2', customer: 'Jane Smith', type: 'home', status: 'approved' },
      ])
    );
  }),

  // Example POST handler
  rest.post('/api/quotes', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: '3', success: true })
    );
  }),

  // Example for a specific quote
  rest.get('/api/quotes/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        customer: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        type: 'auto',
        status: 'pending',
        // Add more fields as needed
      })
    );
  }),
]; 