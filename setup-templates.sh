#!/bin/bash

# Create templates directory if it doesn't exist
mkdir -p backend/app/templates

# Copy document templates to the backend templates directory
cp auto-request-form.docx backend/app/templates/
cp home-quote-request-form.docx backend/app/templates/
cp specialty-quote-request-form.docx backend/app/templates/

# Also keep copies at the root for Docker volume mounting
cp auto-request-form.docx .
cp home-quote-request-form.docx .
cp specialty-quote-request-form.docx .

echo "Document templates have been set up successfully!" 