'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
  pipelineId: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

interface ColumnMapping {
  csvColumn: string;
  crmField: string;
}

interface CSVPreview {
  headers: string[];
  rows: string[][];
}

// Available CRM fields for mapping
const CRM_FIELDS = [
  { value: 'skip', label: 'Skip this column' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone_number', label: 'Phone Number' },
  { value: 'street_address', label: 'Street Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip_code', label: 'ZIP Code' },
  { value: 'date_of_birth', label: 'Date of Birth' },
  { value: 'gender', label: 'Gender' },
  { value: 'marital_status', label: 'Marital Status' },
  { value: 'drivers_license', label: 'Drivers License' },
  { value: 'license_state', label: 'License State' },
  { value: 'current_carrier', label: 'Current Insurance Carrier' },
  { value: 'premium', label: 'Premium' },
  { value: 'auto_premium', label: 'Auto Premium' },
  { value: 'home_premium', label: 'Home Premium' },
  { value: 'specialty_premium', label: 'Specialty Premium' },
  { value: 'insurance_type', label: 'Insurance Type' },
  { value: 'notes', label: 'Notes' },
  { value: 'assigned_to', label: 'Assigned To' },
  { value: 'referred_by', label: 'Referred By' },
  { value: 'education_occupation', label: 'Education/Occupation' },
];

export function LeadImportModal({ isOpen, onClose, onImportComplete, pipelineId }: LeadImportModalProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): CSVPreview => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty CSV file');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1, 6).map(line => // Show first 5 rows for preview
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    return { headers, rows };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await selectedFile.text();
      const preview = parseCSV(text);

      setFile(selectedFile);
      setCsvPreview(preview);
      setImportResult(null);

      // Initialize column mappings with smart defaults
      const mappings = preview.headers.map(header => {
        const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const matchingField = CRM_FIELDS.find(field =>
          field.value && (
            field.value === lowerHeader ||
            field.label.toLowerCase().replace(/[^a-z0-9]/g, '_') === lowerHeader ||
            lowerHeader.includes(field.value.replace('_', ''))
          )
        );

        return {
          csvColumn: header,
          crmField: matchingField?.value || 'skip'
        };
      });

      setColumnMappings(mappings);
      setActiveTab('mapping');

    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Could not parse the CSV file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const syntheticEvent = {
        target: { files: [droppedFile] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  const updateColumnMapping = (csvColumn: string, crmField: string) => {
    setColumnMappings(prev =>
      prev.map(mapping =>
        mapping.csvColumn === csvColumn
          ? { ...mapping, crmField }
          : mapping
      )
    );
  };

  const handleImport = async () => {
    if (!file || !csvPreview) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pipelineId', pipelineId.toString());
      formData.append('columnMappings', JSON.stringify(columnMappings));

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: `Successfully imported ${result.importedCount} leads`,
          importedCount: result.importedCount,
        });

        toast({
          title: "Import successful",
          description: `${result.importedCount} leads have been imported.`,
        });

        onImportComplete(result.importedCount);
        setActiveTab('result');
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Import failed',
          errors: result.errors || [],
        });

        toast({
          title: "Import failed",
          description: result.error || 'An error occurred during import.',
          variant: "destructive",
        });
        setActiveTab('result');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: 'An unexpected error occurred during import.',
      });

      toast({
        title: "Import failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setActiveTab('result');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvPreview(null);
    setColumnMappings([]);
    setImportResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    setActiveTab('upload');
    onClose();
  };

  const downloadTemplate = () => {
    const headers = [
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'street_address',
      'city',
      'state',
      'zip_code',
      'current_carrier',
      'premium',
      'insurance_type',
      'notes'
    ];

    const sampleData = [
      'John,Doe,john.doe@email.com,555-123-4567,123 Main St,Anytown,CA,12345,State Farm,150.00,Auto,Sample lead data'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to import multiple leads into this pipeline.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">1. Upload File</TabsTrigger>
            <TabsTrigger value="mapping" disabled={!csvPreview}>2. Map Columns</TabsTrigger>
            <TabsTrigger value="result" disabled={!importResult}>3. Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {/* Template Download */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Need a template?</span>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                Download Template
              </Button>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium">Drop your CSV file here</p>
                  <p className="text-xs text-muted-foreground">or</p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            {csvPreview && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('mapping')}>
                  Next: Map Columns <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            {csvPreview && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>CSV Preview</CardTitle>
                    <CardDescription>
                      First few rows of your CSV file. Map each column to a CRM field below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32 w-full border rounded">
                      <div className="p-2">
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          <div className="font-medium border-b pb-1">
                            {csvPreview.headers.join(' | ')}
                          </div>
                          {csvPreview.rows.map((row, index) => (
                            <div key={index} className="text-muted-foreground">
                              {row.join(' | ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Column Mapping</CardTitle>
                    <CardDescription>
                      Map each CSV column to the corresponding CRM field. You can skip columns by selecting "Skip this column".
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full">
                      <div className="space-y-3">
                        {columnMappings.map((mapping, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div className="w-1/3">
                              <Label className="text-sm font-medium">{mapping.csvColumn}</Label>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="w-1/2">
                              <Select
                                value={mapping.crmField}
                                onValueChange={(value) => updateColumnMapping(mapping.csvColumn, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select CRM field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CRM_FIELDS.map((field) => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('upload')}>
                    Back to Upload
                  </Button>
                  <Button onClick={handleImport} disabled={isUploading}>
                    {isUploading ? 'Importing...' : 'Import Leads'}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing leads...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {importResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={importResult.success ? "text-green-800" : "text-red-800"}>
                  {importResult.message}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <ScrollArea className="mt-2 max-h-32">
                      <ul className="text-xs space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
