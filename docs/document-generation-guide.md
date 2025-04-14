# Document Generation Guide

This guide covers how to implement the document generation functionality in the Quote Request Generator application.

## Overview

The Quote Request Generator populates DOCX templates with user-provided information. The system:

1. Takes user input from the frontend form
2. Processes and validates the data
3. Injects the data into DOCX templates by replacing placeholders
4. Optionally converts the DOCX to PDF format
5. Makes the generated documents available for download

## Template Placeholders

Placeholders in the DOCX templates follow this format: `{{placeholder-key}}`. For example:

- `{{pniname}}` - Primary Named Insured Name
- `{{v1make}}` - Vehicle 1 Make
- `{{hcovtype}}` - Home Coverage Type

A complete list of placeholders is available in the `placeholders.txt` file.

## Implementation Steps

### 1. Install Required Libraries

```bash
# For Node.js backend
npm install docx docxtemplater pizzip fs-extra

# For PDF conversion (server-side)
apt-get install -y libreoffice-writer
```

### 2. Create the Document Generation Service

Create a file called `documentService.js` in your backend:

```javascript
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class DocumentService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../documents/templates');
    this.outputDir = path.join(__dirname, '../documents/output');
    
    // Ensure output directory exists
    fs.ensureDirSync(this.outputDir);
  }
  
  /**
   * Generate a document from template with provided data
   */
  async generateDocument(templateName, data, outputFormat = 'docx') {
    try {
      // Read template file
      const templatePath = path.join(this.templatesDir, `${templateName}.docx`);
      const content = fs.readFileSync(templatePath, 'binary');
      
      // Create ZIP of template
      const zip = new PizZip(content);
      
      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      
      // Set data for template
      doc.setData(data);
      
      // Apply data to template
      doc.render();
      
      // Get buffer of generated document
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });
      
      // Create unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const docxFilename = `${templateName}-${timestamp}.docx`;
      const docxPath = path.join(this.outputDir, docxFilename);
      
      // Write DOCX file
      fs.writeFileSync(docxPath, buffer);
      
      // Convert to PDF if requested
      if (outputFormat === 'pdf') {
        const pdfFilename = docxFilename.replace('.docx', '.pdf');
        const pdfPath = path.join(this.outputDir, pdfFilename);
        
        await this.convertToPdf(docxPath, pdfPath);
        
        return {
          docxPath,
          pdfPath,
          docxFilename,
          pdfFilename,
        };
      }
      
      return {
        docxPath,
        docxFilename,
      };
    } catch (error) {
      console.error('Document generation error:', error);
      throw new Error(`Failed to generate document: ${error.message}`);
    }
  }
  
  /**
   * Convert DOCX to PDF using LibreOffice
   */
  async convertToPdf(docxPath, pdfPath) {
    try {
      // Use LibreOffice to convert DOCX to PDF
      await execPromise(`libreoffice --headless --convert-to pdf --outdir "${path.dirname(pdfPath)}" "${docxPath}"`);
      
      // LibreOffice ignores the output filename, so we need to rename
      const convertedPdf = docxPath.replace('.docx', '.pdf');
      if (convertedPdf !== pdfPath) {
        fs.moveSync(convertedPdf, pdfPath, { overwrite: true });
      }
      
      return pdfPath;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error(`Failed to convert to PDF: ${error.message}`);
    }
  }
  
  /**
   * Delete a generated document
   */
  deleteDocument(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete document error:', error);
      return false;
    }
  }
}

module.exports = new DocumentService();
```

### 3. Create API Endpoints

Add endpoints to your Express app:

```javascript
const express = require('express');
const router = express.Router();
const documentService = require('./documentService');
const path = require('path');

// Generate document endpoint
router.post('/api/documents/generate', async (req, res) => {
  try {
    const { templateName, data, outputFormat } = req.body;
    
    // Validate request
    if (!templateName || !data) {
      return res.status(400).json({ error: 'Template name and data are required' });
    }
    
    // Generate document
    const result = await documentService.generateDocument(templateName, data, outputFormat);
    
    // Return file paths and URLs
    res.json({
      success: true,
      files: {
        docx: {
          filename: result.docxFilename,
          url: `/api/documents/download/${result.docxFilename}`
        },
        ...(result.pdfFilename && {
          pdf: {
            filename: result.pdfFilename,
            url: `/api/documents/download/${result.pdfFilename}`
          }
        })
      }
    });
  } catch (error) {
    console.error('Document generation API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download document endpoint
router.get('/api/documents/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(documentService.outputDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Document download API error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 4. Frontend Integration

Create a service in your Next.js frontend to handle document generation:

```typescript
// services/documentService.ts
import { API_BASE_URL } from '../lib/api-config';

interface DocumentGenerationRequest {
  templateName: string;
  data: Record<string, any>;
  outputFormat?: 'docx' | 'pdf';
}

interface DocumentGenerationResponse {
  success: boolean;
  files: {
    docx: {
      filename: string;
      url: string;
    };
    pdf?: {
      filename: string;
      url: string;
    };
  };
}

export const generateDocument = async (
  request: DocumentGenerationRequest
): Promise<DocumentGenerationResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate document');
    }

    return await response.json();
  } catch (error) {
    console.error('Document generation error:', error);
    throw error;
  }
};

export const downloadDocument = (url: string, filename: string): void => {
  // Create temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  
  // Append to body, click and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

### 5. Testing Document Generation

Create a test script to verify document generation works correctly:

```javascript
// test-document-generation.js
const documentService = require('./documentService');

async function testDocumentGeneration() {
  try {
    const templateName = 'auto-request-form';
    
    // Sample data matching template placeholders
    const data = {
      pniname: 'John Doe',
      pniaddr: '123 Main St, Anytown, MN 55123',
      pniemail: 'john.doe@example.com',
      pniphone: '612-555-1234',
      'current-date': new Date().toLocaleDateString(),
      'effective-date': '01/01/2024',
      'referred-by': 'Jane Smith',
      v1yr: '2022',
      v1make: 'Toyota',
      v1model: 'Camry',
      v1vin: 'JT2BF22K1W0123456',
      // Add more fields as needed
    };
    
    console.log('Generating DOCX document...');
    const docxResult = await documentService.generateDocument(templateName, data, 'docx');
    console.log('DOCX generated:', docxResult);
    
    console.log('Generating PDF document...');
    const pdfResult = await documentService.generateDocument(templateName, data, 'pdf');
    console.log('PDF generated:', pdfResult);
    
    console.log('Document generation test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDocumentGeneration();
```

## Best Practices

1. **Error Handling**: Implement robust error handling around document generation to capture and log specific issues.

2. **Performance**: Large templates or many concurrent generations can impact performance. Consider implementing a queue system for high-traffic scenarios.

3. **File Management**: Implement a cleanup strategy to remove old generated documents after they've been downloaded or after a certain time period.

4. **Template Validation**: Create a validation process to ensure templates have valid placeholders before they're used in production.

5. **Security**: Validate and sanitize all user input before injecting it into document templates to prevent template injection attacks.

## Troubleshooting

### Common Issues and Solutions

1. **Missing Placeholders**: If a placeholder isn't replaced, check that:
   - The placeholder syntax in the template matches exactly (case-sensitive)
   - The data object contains the corresponding key

2. **PDF Conversion Fails**:
   - Ensure LibreOffice is installed correctly: `libreoffice --version`
   - Check permissions on the output directory
   - Look for LibreOffice error logs: `/var/log/libreoffice/`

3. **Template Loading Errors**:
   - Verify the template file exists and is a valid DOCX file
   - Check for corrupt or non-standard DOCX files
   - Use a fresh template created with Microsoft Word or LibreOffice

4. **Performance Issues**:
   - Large templates may take longer to process
   - LibreOffice conversion is resource-intensive; consider a lightweight alternative for high-volume scenarios 