// This function is required when using dynamic routes with output: 'export'
// It tells Next.js which routes to pre-render at build time
export function generateStaticParams() {
  // For dynamic routes with client components, we can return an empty array
  // This tells Next.js not to pre-render any specific paths at build time
  // The routes will be generated on-demand at runtime
  return [];
}
