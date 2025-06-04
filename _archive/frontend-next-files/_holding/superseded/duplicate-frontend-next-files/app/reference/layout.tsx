import Link from 'next/link';

export const metadata = {
  title: 'Component Reference Library | Gonzigo CRM',
  description: 'Browse UI components from the Shadcn Pro template for use in Gonzigo CRM',
};

export default function ReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-800 hover:text-gray-600">
              ← Back to App
            </Link>
            <h1 className="text-xl font-semibold">Component Reference Library</h1>
          </div>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link href="/reference" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/reference/COMPONENT_CATALOG.md" className="text-gray-600 hover:text-gray-900">
                  Catalog
                </Link>
              </li>
              <li>
                <a 
                  href="https://ui.shadcn.com/docs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Shadcn Docs
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>This reference library contains components from a purchased template for internal use only.</p>
        </div>
      </footer>
    </div>
  );
}
