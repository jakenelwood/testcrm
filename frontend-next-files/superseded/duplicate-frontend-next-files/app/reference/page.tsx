'use client';

import { useState } from 'react';
import Link from 'next/link';

// Component categories and their paths
const componentCategories = [
  {
    name: 'UI Components',
    subcategories: [
      { name: 'Card Components', path: '/reference/components/ui/card' },
      { name: 'Chart Components', path: '/reference/components/ui/charts' },
      { name: 'Audio Components', path: '/reference/components/ui/audio' },
      { name: 'Utility Components', path: '/reference/components/ui' },
    ]
  },
  {
    name: 'Layout Components',
    subcategories: [
      { name: 'Sidebar', path: '/reference/components/layouts/sidebar' },
      { name: 'Navbar', path: '/reference/components/layouts/navbar' },
      { name: 'Footer', path: '/reference/components/layouts/footer' },
      { name: 'Main Layout', path: '/reference/components/layouts/main' },
    ]
  },
  {
    name: 'Template Components',
    subcategories: [
      { name: 'Dashboard', path: '/reference/components/templates/dashboard' },
      { name: 'Authentication', path: '/reference/components/templates/auth' },
      { name: 'Landing', path: '/reference/components/templates/landing' },
      { name: 'Pricing', path: '/reference/components/templates/pricing' },
    ]
  }
];

export default function ReferenceComponentsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">UI Component Reference Library</h1>
        <p className="text-gray-600">
          Browse the available components from the Shadcn Pro template. Use these components as reference when building new features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Component Categories</h2>
          <nav>
            <ul className="space-y-1">
              {componentCategories.map((category) => (
                <li key={category.name}>
                  <button
                    onClick={() => setActiveCategory(activeCategory === category.name ? null : category.name)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 font-medium flex justify-between items-center"
                  >
                    {category.name}
                    <span>{activeCategory === category.name ? '−' : '+'}</span>
                  </button>
                  
                  {activeCategory === category.name && (
                    <ul className="ml-4 mt-1 space-y-1">
                      {category.subcategories.map((subcategory) => (
                        <li key={subcategory.name}>
                          <Link 
                            href={subcategory.path}
                            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                          >
                            {subcategory.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            
            <div className="prose max-w-none">
              <p>
                This reference library contains UI components extracted from the purchased Shadcn Pro template.
                Use these components as reference when building new features in the Gonzigo CRM application.
              </p>
              
              <h3>How to Use This Reference Library</h3>
              <ol>
                <li>Browse the categories on the left to find components you need</li>
                <li>Click on a component category to view available components</li>
                <li>Copy the component to your working directory or import it directly</li>
                <li>Customize the component to fit your specific needs</li>
              </ol>
              
              <h3>Component Structure</h3>
              <p>The components are organized into three main categories:</p>
              <ul>
                <li><strong>UI Components</strong> - Basic UI elements like buttons, inputs, cards, etc.</li>
                <li><strong>Layout Components</strong> - Structural components like sidebars, headers, etc.</li>
                <li><strong>Template Components</strong> - Full page templates and complex component combinations</li>
              </ul>
              
              <h3>Component Catalog</h3>
              <p>
                For a complete list of all available components, see the{' '}
                <Link href="/reference/COMPONENT_CATALOG.md" className="text-blue-600 hover:underline">
                  Component Catalog
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
