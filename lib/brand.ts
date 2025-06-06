/**
 * Centralized brand configuration
 * All brand-related constants and utilities in one place
 */

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'CRM',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Your Sales Assistant',
  
  // Derived values
  get lowerName() {
    return this.name.toLowerCase();
  },
  
  get fullTitle() {
    return `${this.name} | ${this.tagline}`;
  },
  
  get description() {
    return `The AI-powered CRM that thinks like a closer. ${this.name} listens, remembers, and nudges at just the right time.`;
  },
  
  // Common brand text patterns
  get copyrightText() {
    return `© ${new Date().getFullYear()} ${this.name}. All rights reserved.`;
  },
  
  get aiAssistantSignature() {
    return `— ${this.lowerName}, your AI assistant`;
  },
  
  get dashboardTitle() {
    return `${this.lowerName} dashboard`;
  },
  
  get pipelineTitle() {
    return `${this.lowerName} pipeline view`;
  },
  
  get aiAssistantTitle() {
    return `${this.lowerName} ai assistant`;
  },
  
  // Helper function for dynamic text replacement
  formatText(text: string): string {
    return text
      .replace(/\*\*BRAND\*\*/g, this.name)
      .replace(/\*\*brand\*\*/g, this.lowerName);
  }
};

// Export individual values for convenience
export const { name: brandName, tagline: brandTagline, lowerName: brandLowerName } = brand;
