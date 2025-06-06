import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Download, FileText, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useDocuments, useGenerateDocument, useDownloadDocument } from '@/lib/hooks/useDocuments';

interface DocumentGenerationPanelProps {
  quoteId: string;
}

export default function DocumentGenerationPanel({ quoteId }: DocumentGenerationPanelProps) {
  const [fileType, setFileType] = useState<'docx' | 'pdf'>('docx');
  
  // Use React Query hooks
  const { data: documents, isLoading: isLoadingDocuments, error: documentsError } = useDocuments(quoteId);
  const { mutate: generateDocument, isPending: isGenerating } = useGenerateDocument();
  const { mutate: downloadDocument, isPending: isDownloading } = useDownloadDocument();

  const handleGenerateDocument = () => {
    generateDocument({ quoteId, fileType });
  };

  const handleDownloadDocument = (documentId: string) => {
    downloadDocument(documentId);
  };

  const isDisabled = isGenerating || isDownloading || !quoteId;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Document Generation</CardTitle>
        <CardDescription>Generate and manage quote documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileFormat">File Format</Label>
            <Select
              value={fileType}
              onValueChange={(value) => setFileType(value as 'docx' | 'pdf')}
            >
              <SelectTrigger id="fileFormat">
                <SelectValue placeholder="Select file format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="docx">DOCX</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleGenerateDocument} 
            disabled={isDisabled}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Document'
            )}
          </Button>
        </div>
        
        {documentsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to load documents. Please try again.</AlertDescription>
          </Alert>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-2">Recent Documents</h3>
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc.filename}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(new Date(doc.createdAt))}</TableCell>
                    <TableCell>{doc.fileType.toUpperCase()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.id)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No documents generated yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 