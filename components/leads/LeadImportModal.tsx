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
import { Upload, FileText, AlertCircle, CheckCircle, ArrowRight, Users, Loader2 } from "lucide-react";
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
  driverNumber?: number; // For driver-specific fields
  fieldType?: 'primary' | 'driver' | 'general'; // Field category
}

interface CSVPreview {
  headers: string[];
  rows: string[][];
}

interface DetectedDriver {
  driverNumber: number;
  fields: string[];
  completeness: number; // Percentage of required fields detected
}

interface DriverColumnPattern {
  pattern: RegExp;
  fieldType: string;
  extractDriverNumber: (match: RegExpMatchArray) => number;
}

// Driver column patterns for detection (supports up to 4 drivers)
const DRIVER_PATTERNS: DriverColumnPattern[] = [
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:first|fname|first_name)/i,
    fieldType: 'first_name',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:last|lname|last_name)/i,
    fieldType: 'last_name',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:dob|date_of_birth|birth_date)/i,
    fieldType: 'date_of_birth',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:license|dl|drivers_license|license_number)/i,
    fieldType: 'drivers_license',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:license_state|dl_state|state)/i,
    fieldType: 'license_state',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:gender|sex)/i,
    fieldType: 'gender',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:marital|marital_status)/i,
    fieldType: 'marital_status',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:sr22|sr_22)/i,
    fieldType: 'sr22',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:education)/i,
    fieldType: 'education',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:occupation|job)/i,
    fieldType: 'occupation',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:relation|relationship)/i,
    fieldType: 'relation_to_primary',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:driver|additional_driver|add_driver)[\s_-]*([1-4])[\s_-]*(?:military)/i,
    fieldType: 'military',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  }
];

// Vehicle column patterns for detection (supports up to 4 vehicles)
const VEHICLE_PATTERNS: DriverColumnPattern[] = [
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:make)/i,
    fieldType: 'auto_vehicle_make',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:model)/i,
    fieldType: 'auto_vehicle_model',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:year)/i,
    fieldType: 'auto_vehicle_year',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:vin)/i,
    fieldType: 'auto_vehicle_vin',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:driver|primary_driver)/i,
    fieldType: 'auto_vehicle_driver',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:usage)/i,
    fieldType: 'auto_vehicle_usage',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:annual_miles|yearly_miles)/i,
    fieldType: 'auto_vehicle_annual_miles',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:daily_miles)/i,
    fieldType: 'auto_vehicle_daily_miles',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:financed|financing)/i,
    fieldType: 'auto_vehicle_financed',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:collision)/i,
    fieldType: 'auto_vehicle_collision',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:comp|comprehensive)/i,
    fieldType: 'auto_vehicle_comp',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:gap)/i,
    fieldType: 'auto_vehicle_gap',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:glass)/i,
    fieldType: 'auto_vehicle_glass',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:tow|towing)/i,
    fieldType: 'auto_vehicle_tow',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  },
  {
    pattern: /(?:vehicle|auto_vehicle|car)[\s_-]*([1-4])[\s_-]*(?:rental|rental_car)/i,
    fieldType: 'auto_vehicle_rental_car_reimbursement',
    extractDriverNumber: (match) => parseInt(match[1] || '1')
  }
];

// Available CRM fields for mapping
const CRM_FIELDS = [
  { value: 'skip', label: 'Skip this column', category: 'general' },

  // Primary Named Insured Fields
  { value: 'first_name', label: 'Primary - First Name', category: 'primary' },
  { value: 'last_name', label: 'Primary - Last Name', category: 'primary' },
  { value: 'email', label: 'Primary - Email', category: 'primary' },
  { value: 'phone_number', label: 'Primary - Phone Number', category: 'primary' },
  { value: 'street_address', label: 'Primary - Street Address', category: 'primary' },
  { value: 'city', label: 'Primary - City', category: 'primary' },
  { value: 'state', label: 'Primary - State', category: 'primary' },
  { value: 'zip_code', label: 'Primary - ZIP Code', category: 'primary' },
  { value: 'date_of_birth', label: 'Primary - Date of Birth', category: 'primary' },
  { value: 'gender', label: 'Primary - Gender', category: 'primary' },
  { value: 'marital_status', label: 'Primary - Marital Status', category: 'primary' },
  { value: 'drivers_license', label: 'Primary - Drivers License', category: 'primary' },
  { value: 'license_state', label: 'Primary - License State', category: 'primary' },
  { value: 'education', label: 'Primary - Education', category: 'primary' },
  { value: 'occupation', label: 'Primary - Occupation', category: 'primary' },
  { value: 'sr22', label: 'Primary - SR22 Required', category: 'primary' },
  { value: 'military', label: 'Primary - Military Status', category: 'primary' },
  { value: 'residence', label: 'Primary - Residence (Own/Rent)', category: 'primary' },

  // General Insurance Fields
  { value: 'current_carrier', label: 'Current Insurance Carrier', category: 'general' },
  { value: 'premium', label: 'Premium', category: 'general' },
  { value: 'auto_premium', label: 'Auto Premium', category: 'general' },
  { value: 'home_premium', label: 'Home Premium', category: 'general' },
  { value: 'specialty_premium', label: 'Specialty Premium', category: 'general' },
  { value: 'notes', label: 'Notes', category: 'general' },
  { value: 'referred_by', label: 'Referred By', category: 'general' },
  { value: 'mailing_address', label: 'Mailing Address', category: 'general' },
  { value: 'auto_expiration_date', label: 'Auto Policy Expiration Date', category: 'general' },

  // Vehicle Fields - Vehicle 1
  { value: 'auto_vehicle_1_make', label: 'Vehicle 1 - Make', category: 'vehicle' },
  { value: 'auto_vehicle_1_model', label: 'Vehicle 1 - Model', category: 'vehicle' },
  { value: 'auto_vehicle_1_year', label: 'Vehicle 1 - Year', category: 'vehicle' },
  { value: 'auto_vehicle_1_vin', label: 'Vehicle 1 - VIN', category: 'vehicle' },
  { value: 'auto_vehicle_1_driver', label: 'Vehicle 1 - Primary Driver', category: 'vehicle' },
  { value: 'auto_vehicle_1_usage', label: 'Vehicle 1 - Usage', category: 'vehicle' },
  { value: 'auto_vehicle_1_annual_miles', label: 'Vehicle 1 - Annual Miles', category: 'vehicle' },
  { value: 'auto_vehicle_1_daily_miles', label: 'Vehicle 1 - Daily Miles', category: 'vehicle' },
  { value: 'auto_vehicle_1_financed', label: 'Vehicle 1 - Financed', category: 'vehicle' },
  { value: 'auto_vehicle_1_collision', label: 'Vehicle 1 - Collision Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_1_comp', label: 'Vehicle 1 - Comprehensive Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_1_gap', label: 'Vehicle 1 - GAP Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_1_glass', label: 'Vehicle 1 - Glass Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_1_tow', label: 'Vehicle 1 - Towing Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_1_rental_car_reimbursement', label: 'Vehicle 1 - Rental Car Coverage', category: 'vehicle' },

  // Vehicle Fields - Vehicle 2
  { value: 'auto_vehicle_2_make', label: 'Vehicle 2 - Make', category: 'vehicle' },
  { value: 'auto_vehicle_2_model', label: 'Vehicle 2 - Model', category: 'vehicle' },
  { value: 'auto_vehicle_2_year', label: 'Vehicle 2 - Year', category: 'vehicle' },
  { value: 'auto_vehicle_2_vin', label: 'Vehicle 2 - VIN', category: 'vehicle' },
  { value: 'auto_vehicle_2_driver', label: 'Vehicle 2 - Primary Driver', category: 'vehicle' },
  { value: 'auto_vehicle_2_usage', label: 'Vehicle 2 - Usage', category: 'vehicle' },
  { value: 'auto_vehicle_2_annual_miles', label: 'Vehicle 2 - Annual Miles', category: 'vehicle' },
  { value: 'auto_vehicle_2_daily_miles', label: 'Vehicle 2 - Daily Miles', category: 'vehicle' },
  { value: 'auto_vehicle_2_financed', label: 'Vehicle 2 - Financed', category: 'vehicle' },
  { value: 'auto_vehicle_2_collision', label: 'Vehicle 2 - Collision Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_2_comp', label: 'Vehicle 2 - Comprehensive Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_2_gap', label: 'Vehicle 2 - GAP Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_2_glass', label: 'Vehicle 2 - Glass Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_2_tow', label: 'Vehicle 2 - Towing Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_2_rental_car_reimbursement', label: 'Vehicle 2 - Rental Car Coverage', category: 'vehicle' },

  // Vehicle Fields - Vehicle 3
  { value: 'auto_vehicle_3_make', label: 'Vehicle 3 - Make', category: 'vehicle' },
  { value: 'auto_vehicle_3_model', label: 'Vehicle 3 - Model', category: 'vehicle' },
  { value: 'auto_vehicle_3_year', label: 'Vehicle 3 - Year', category: 'vehicle' },
  { value: 'auto_vehicle_3_vin', label: 'Vehicle 3 - VIN', category: 'vehicle' },
  { value: 'auto_vehicle_3_driver', label: 'Vehicle 3 - Primary Driver', category: 'vehicle' },
  { value: 'auto_vehicle_3_usage', label: 'Vehicle 3 - Usage', category: 'vehicle' },
  { value: 'auto_vehicle_3_annual_miles', label: 'Vehicle 3 - Annual Miles', category: 'vehicle' },
  { value: 'auto_vehicle_3_daily_miles', label: 'Vehicle 3 - Daily Miles', category: 'vehicle' },
  { value: 'auto_vehicle_3_financed', label: 'Vehicle 3 - Financed', category: 'vehicle' },
  { value: 'auto_vehicle_3_collision', label: 'Vehicle 3 - Collision Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_3_comp', label: 'Vehicle 3 - Comprehensive Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_3_gap', label: 'Vehicle 3 - GAP Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_3_glass', label: 'Vehicle 3 - Glass Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_3_tow', label: 'Vehicle 3 - Towing Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_3_rental_car_reimbursement', label: 'Vehicle 3 - Rental Car Coverage', category: 'vehicle' },

  // Vehicle Fields - Vehicle 4
  { value: 'auto_vehicle_4_make', label: 'Vehicle 4 - Make', category: 'vehicle' },
  { value: 'auto_vehicle_4_model', label: 'Vehicle 4 - Model', category: 'vehicle' },
  { value: 'auto_vehicle_4_year', label: 'Vehicle 4 - Year', category: 'vehicle' },
  { value: 'auto_vehicle_4_vin', label: 'Vehicle 4 - VIN', category: 'vehicle' },
  { value: 'auto_vehicle_4_driver', label: 'Vehicle 4 - Primary Driver', category: 'vehicle' },
  { value: 'auto_vehicle_4_usage', label: 'Vehicle 4 - Usage', category: 'vehicle' },
  { value: 'auto_vehicle_4_annual_miles', label: 'Vehicle 4 - Annual Miles', category: 'vehicle' },
  { value: 'auto_vehicle_4_daily_miles', label: 'Vehicle 4 - Daily Miles', category: 'vehicle' },
  { value: 'auto_vehicle_4_financed', label: 'Vehicle 4 - Financed', category: 'vehicle' },
  { value: 'auto_vehicle_4_collision', label: 'Vehicle 4 - Collision Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_4_comp', label: 'Vehicle 4 - Comprehensive Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_4_gap', label: 'Vehicle 4 - GAP Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_4_glass', label: 'Vehicle 4 - Glass Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_4_tow', label: 'Vehicle 4 - Towing Coverage', category: 'vehicle' },
  { value: 'auto_vehicle_4_rental_car_reimbursement', label: 'Vehicle 4 - Rental Car Coverage', category: 'vehicle' },
];

// Driver and vehicle detection and mapping functions
function detectDriverColumns(headers: string[]): { detectedDrivers: DetectedDriver[], driverMappings: ColumnMapping[] } {
  const driverFields: { [driverNumber: number]: { [fieldType: string]: string } } = {};
  const vehicleFields: { [vehicleNumber: number]: { [fieldType: string]: string } } = {};
  const driverMappings: ColumnMapping[] = [];

  headers.forEach(header => {
    // Check for driver patterns
    for (const pattern of DRIVER_PATTERNS) {
      const match = header.match(pattern.pattern);
      if (match) {
        const driverNumber = pattern.extractDriverNumber(match);
        const fieldType = pattern.fieldType;

        if (!driverFields[driverNumber]) {
          driverFields[driverNumber] = {};
        }
        driverFields[driverNumber][fieldType] = header;

        driverMappings.push({
          csvColumn: header,
          crmField: `driver_${driverNumber}_${fieldType}`,
          driverNumber,
          fieldType: 'driver'
        });
        return; // Found a match, move to next header
      }
    }

    // Check for vehicle patterns
    for (const pattern of VEHICLE_PATTERNS) {
      const match = header.match(pattern.pattern);
      if (match) {
        const vehicleNumber = pattern.extractDriverNumber(match); // Reusing the same function
        const fieldType = pattern.fieldType;

        if (!vehicleFields[vehicleNumber]) {
          vehicleFields[vehicleNumber] = {};
        }
        vehicleFields[vehicleNumber][fieldType] = header;

        driverMappings.push({
          csvColumn: header,
          crmField: `auto_vehicle_${vehicleNumber}_${fieldType.replace('auto_vehicle_', '')}`,
          driverNumber: vehicleNumber,
          fieldType: 'general'
        });
        return; // Found a match, move to next header
      }
    }

    // Check for residence field
    if (/(?:residence|own|rent|housing)/i.test(header)) {
      driverMappings.push({
        csvColumn: header,
        crmField: 'residence',
        fieldType: 'primary'
      });
    }

    // Check for auto_expiration_date field
    if (/(?:auto_expiration|auto_exp|policy_exp|expiration)/i.test(header)) {
      driverMappings.push({
        csvColumn: header,
        crmField: 'auto_expiration_date',
        fieldType: 'general'
      });
    }
  });

  // Calculate completeness for each detected driver
  const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'drivers_license'];
  const detectedDrivers: DetectedDriver[] = Object.entries(driverFields).map(([driverNum, fields]) => {
    const driverNumber = parseInt(driverNum);
    const fieldNames = Object.keys(fields);
    const requiredFieldsPresent = requiredFields.filter(field => fieldNames.includes(field)).length;
    const completeness = (requiredFieldsPresent / requiredFields.length) * 100;

    return {
      driverNumber,
      fields: fieldNames,
      completeness
    };
  }).sort((a, b) => a.driverNumber - b.driverNumber);

  return { detectedDrivers, driverMappings };
}

function generateDriverFieldOptions(detectedDrivers: DetectedDriver[]): Array<{ value: string; label: string; category: string }> {
  const driverFields: Array<{ value: string; label: string; category: string }> = [];

  detectedDrivers.forEach(driver => {
    const driverNum = driver.driverNumber;

    // Add all possible driver fields for this driver number
    const driverFieldTypes = [
      { field: 'first_name', label: 'First Name' },
      { field: 'last_name', label: 'Last Name' },
      { field: 'date_of_birth', label: 'Date of Birth' },
      { field: 'drivers_license', label: 'Drivers License' },
      { field: 'license_state', label: 'License State' },
      { field: 'gender', label: 'Gender' },
      { field: 'marital_status', label: 'Marital Status' },
      { field: 'education', label: 'Education' },
      { field: 'occupation', label: 'Occupation' },
      { field: 'relation_to_primary', label: 'Relation to Primary' },
      { field: 'sr22', label: 'SR22 Required' },
      { field: 'military', label: 'Military Status' }
    ];

    driverFieldTypes.forEach(({ field, label }) => {
      driverFields.push({
        value: `driver_${driverNum}_${field}`,
        label: `Driver ${driverNum} - ${label}`,
        category: 'driver'
      });
    });
  });

  return driverFields;
}

export function LeadImportModal({ isOpen, onClose, onImportComplete, pipelineId }: LeadImportModalProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [detectedDrivers, setDetectedDrivers] = useState<DetectedDriver[]>([]);
  const [availableFields, setAvailableFields] = useState(CRM_FIELDS);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [leadSource, setLeadSource] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): CSVPreview => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty CSV file');

    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
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

    setIsProcessingCsv(true);

    try {
      // Use current JavaScript implementation for now
      const text = await selectedFile.text();
      const preview = parseCSV(text);

      setFile(selectedFile);
      setCsvPreview(preview);
      setImportResult(null);

      // Detect driver columns and generate enhanced field options
      const { detectedDrivers: drivers, driverMappings } = detectDriverColumns(preview.headers);
      setDetectedDrivers(drivers);

      // Generate dynamic driver field options
      const driverFieldOptions = generateDriverFieldOptions(drivers);
      const enhancedFields = [...CRM_FIELDS, ...driverFieldOptions];
      setAvailableFields(enhancedFields);

      // Initialize column mappings with smart defaults including driver detection
      const mappings = preview.headers.map(header => {
        // First check if this is a detected driver field
        const driverMapping = driverMappings.find(dm => dm.csvColumn === header);
        if (driverMapping) {
          return driverMapping;
        }

        // Otherwise, use standard field matching
        const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const matchingField = enhancedFields.find(field =>
          field.value && field.value !== 'skip' && (
            field.value === lowerHeader ||
            field.label.toLowerCase().replace(/[^a-z0-9]/g, '_') === lowerHeader ||
            lowerHeader.includes(field.value.replace('_', ''))
          )
        );

        return {
          csvColumn: header,
          crmField: matchingField?.value || 'skip',
          fieldType: matchingField?.category as 'primary' | 'driver' | 'general' || 'general'
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
    } finally {
      setIsProcessingCsv(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      // Create a mock input element with files
      const mockInput = document.createElement('input');
      mockInput.type = 'file';
      Object.defineProperty(mockInput, 'files', {
        value: [droppedFile],
        writable: false,
      });

      const syntheticEvent = {
        target: mockInput,
        currentTarget: mockInput,
        nativeEvent: new Event('change'),
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: false,
        preventDefault: () => {},
        isDefaultPrevented: () => false,
        stopPropagation: () => {},
        isPropagationStopped: () => false,
        persist: () => {},
        timeStamp: Date.now(),
        type: 'change'
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

    if (!leadSource.trim()) {
      toast({
        title: "Error",
        description: "Please specify the source of these leads.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pipelineId', pipelineId.toString());
      formData.append('columnMappings', JSON.stringify(columnMappings));
      formData.append('leadSource', leadSource.trim());
      formData.append('importFileName', importFileName.trim() || file.name);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Use Python service for faster import processing
      const response = await fetch('http://localhost:8001/import-leads', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        setImportResult({
          success: true,
          message: `Successfully imported ${result.imported_count} leads${result.processing_time ? ` in ${result.processing_time}s` : ''}`,
          importedCount: result.imported_count,
          errors: result.errors,
        });

        toast({
          title: "Import successful",
          description: `${result.imported_count} leads have been imported.`,
        });

        onImportComplete(result.imported_count);
        setActiveTab('result');
      } else {
        setImportResult({
          success: false,
          message: result.error || result.detail || 'Import failed',
          errors: result.errors || [],
        });

        toast({
          title: "Import failed",
          description: result.error || result.detail || 'An error occurred during import.',
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
    setIsProcessingCsv(false);
    setLeadSource('');
    setImportFileName('');
    setActiveTab('upload');
    onClose();
  };

  const downloadTemplate = () => {
    const headers = [
      // Primary Named Insured
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'street_address',
      'city',
      'state',
      'zip_code',
      'date_of_birth',
      'gender',
      'marital_status',
      'drivers_license',
      'license_state',
      'education',
      'occupation',
      'sr22',
      'military',
      'residence',

      // Additional Drivers (up to 4)
      'driver_1_first_name',
      'driver_1_last_name',
      'driver_1_date_of_birth',
      'driver_1_gender',
      'driver_1_marital_status',
      'driver_1_drivers_license',
      'driver_1_license_state',
      'driver_1_education',
      'driver_1_occupation',
      'driver_1_relation_to_primary',
      'driver_1_sr22',
      'driver_1_military',

      'driver_2_first_name',
      'driver_2_last_name',
      'driver_2_date_of_birth',
      'driver_2_gender',
      'driver_2_marital_status',
      'driver_2_drivers_license',
      'driver_2_license_state',
      'driver_2_education',
      'driver_2_occupation',
      'driver_2_relation_to_primary',
      'driver_2_sr22',
      'driver_2_military',

      'driver_3_first_name',
      'driver_3_last_name',
      'driver_3_date_of_birth',
      'driver_3_gender',
      'driver_3_marital_status',
      'driver_3_drivers_license',
      'driver_3_license_state',
      'driver_3_education',
      'driver_3_occupation',
      'driver_3_relation_to_primary',
      'driver_3_sr22',
      'driver_3_military',

      'driver_4_first_name',
      'driver_4_last_name',
      'driver_4_date_of_birth',
      'driver_4_gender',
      'driver_4_marital_status',
      'driver_4_drivers_license',
      'driver_4_license_state',
      'driver_4_education',
      'driver_4_occupation',
      'driver_4_relation_to_primary',
      'driver_4_sr22',
      'driver_4_military',

      // Vehicle Information (up to 4 vehicles)
      'auto_vehicle_1_make',
      'auto_vehicle_1_model',
      'auto_vehicle_1_year',
      'auto_vehicle_1_vin',
      'auto_vehicle_1_driver',
      'auto_vehicle_1_usage',
      'auto_vehicle_1_annual_miles',
      'auto_vehicle_1_daily_miles',
      'auto_vehicle_1_financed',
      'auto_vehicle_1_collision',
      'auto_vehicle_1_comp',
      'auto_vehicle_1_gap',
      'auto_vehicle_1_glass',
      'auto_vehicle_1_tow',
      'auto_vehicle_1_rental_car_reimbursement',

      'auto_vehicle_2_make',
      'auto_vehicle_2_model',
      'auto_vehicle_2_year',
      'auto_vehicle_2_vin',
      'auto_vehicle_2_driver',
      'auto_vehicle_2_usage',
      'auto_vehicle_2_annual_miles',
      'auto_vehicle_2_daily_miles',
      'auto_vehicle_2_financed',
      'auto_vehicle_2_collision',
      'auto_vehicle_2_comp',
      'auto_vehicle_2_gap',
      'auto_vehicle_2_glass',
      'auto_vehicle_2_tow',
      'auto_vehicle_2_rental_car_reimbursement',

      'auto_vehicle_3_make',
      'auto_vehicle_3_model',
      'auto_vehicle_3_year',
      'auto_vehicle_3_vin',
      'auto_vehicle_3_driver',
      'auto_vehicle_3_usage',
      'auto_vehicle_3_annual_miles',
      'auto_vehicle_3_daily_miles',
      'auto_vehicle_3_financed',
      'auto_vehicle_3_collision',
      'auto_vehicle_3_comp',
      'auto_vehicle_3_gap',
      'auto_vehicle_3_glass',
      'auto_vehicle_3_tow',
      'auto_vehicle_3_rental_car_reimbursement',

      'auto_vehicle_4_make',
      'auto_vehicle_4_model',
      'auto_vehicle_4_year',
      'auto_vehicle_4_vin',
      'auto_vehicle_4_driver',
      'auto_vehicle_4_usage',
      'auto_vehicle_4_annual_miles',
      'auto_vehicle_4_daily_miles',
      'auto_vehicle_4_financed',
      'auto_vehicle_4_collision',
      'auto_vehicle_4_comp',
      'auto_vehicle_4_gap',
      'auto_vehicle_4_glass',
      'auto_vehicle_4_tow',
      'auto_vehicle_4_rental_car_reimbursement',

      // General Insurance Info
      'current_carrier',
      'premium',
      'auto_premium',
      'home_premium',
      'specialty_premium',
      'auto_expiration_date',
      'notes',
      'referred_by'
    ];

    const sampleData = [
      // Primary + residence + 4 drivers + 4 vehicles + general info
      'John,Doe,john.doe@email.com,555-123-4567,123 Main St,Anytown,CA,12345,1985-06-15,Male,Married,DL123456789,CA,College,Engineer,No,No,Own,' +
      'Jane,Doe,1987-08-20,Female,Married,DL987654321,CA,College,Teacher,Spouse,No,No,' +
      'Jake,Doe,2005-03-10,Male,Single,DL555666777,CA,High School,Student,Child,No,No,' +
      'Jill,Doe,2010-12-25,Female,Single,DL888999000,CA,Elementary,Student,Child,No,No,' +
      'Sarah,Smith,1990-04-15,Female,Single,DL111222333,CA,College,Nurse,Friend,No,No,' +
      'Toyota,Camry,2020,1HGBH41JXMN109186,John,Commute,12000,30,Yes,Yes,Yes,No,Yes,Yes,Yes,' +
      'Honda,Civic,2018,2HGFC2F59JH123456,Jane,Commute,8000,25,No,Yes,Yes,No,No,Yes,No,' +
      'Ford,F150,2019,1FTFW1ET5KFA12345,John,Work,15000,40,Yes,Yes,Yes,Yes,Yes,Yes,Yes,' +
      'Nissan,Altima,2021,1N4AL3AP5MC123456,Sarah,Pleasure,6000,20,No,Yes,Yes,No,Yes,No,Yes,' +
      'State Farm,150.00,150.00,,,2024-12-31,Sample lead with comprehensive data,Friend Referral'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template_with_drivers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] h-[95vh] max-h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Import Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to import multiple leads into this pipeline.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="upload">1. Upload File</TabsTrigger>
            <TabsTrigger value="mapping" disabled={!csvPreview}>2. Map Columns</TabsTrigger>
            <TabsTrigger value="result" disabled={!importResult}>3. Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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

            {/* Processing Indicator */}
            {isProcessingCsv && (
              <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Processing CSV file...</span>
              </div>
            )}

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isProcessingCsv ? 'border-blue-300 bg-blue-50 opacity-50 pointer-events-none' :
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
                disabled={isProcessingCsv}
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
                    disabled={isProcessingCsv}
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
                    disabled={isProcessingCsv}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            </div>

            {/* Fixed button section at bottom */}
            {csvPreview && (
              <div className="flex justify-end pt-4 border-t flex-shrink-0">
                <Button onClick={() => setActiveTab('mapping')}>
                  Next: Map Columns <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="flex-1 flex flex-col min-h-0">
            {csvPreview && (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {/* Import Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Import Information</CardTitle>
                    <CardDescription>
                      Specify the source and file name for tracking purposes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="leadSource" className="text-sm">Lead Source *</Label>
                        <Input
                          id="leadSource"
                          placeholder="e.g., Marketing Campaign, Partner Referral"
                          value={leadSource}
                          onChange={(e) => setLeadSource(e.target.value)}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="importFileName" className="text-sm">Import File Name</Label>
                        <Input
                          id="importFileName"
                          placeholder={file?.name || "Auto-filled from uploaded file"}
                          value={importFileName}
                          onChange={(e) => setImportFileName(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Column Mapping</CardTitle>
                    <CardDescription>
                      Map each CSV column to the corresponding CRM field. Driver fields have been automatically detected and mapped.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-80 w-full">
                      <div className="space-y-3">
                        {columnMappings.map((mapping, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div className="w-1/3">
                              <Label className={`text-sm font-medium ${
                                mapping.fieldType === 'driver' ? 'text-blue-600' :
                                mapping.fieldType === 'general' ? 'text-purple-600' :
                                mapping.fieldType === 'primary' ? 'text-green-600' :
                                'text-gray-600'
                              }`}>
                                {mapping.csvColumn}
                                {mapping.driverNumber && mapping.fieldType === 'driver' && (
                                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                    Driver {mapping.driverNumber}
                                  </span>
                                )}
                                {mapping.driverNumber && mapping.fieldType === 'general' && (
                                  <span className="ml-1 text-xs bg-purple-100 text-purple-800 px-1 rounded">
                                    Vehicle {mapping.driverNumber}
                                  </span>
                                )}
                              </Label>
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
                                  <SelectItem value="skip">Skip this column</SelectItem>

                                  {/* Primary Fields */}
                                  <div className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50">
                                    Primary Named Insured
                                  </div>
                                  {availableFields.filter(f => f.category === 'primary').map((field) => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label}
                                    </SelectItem>
                                  ))}

                                  {/* Driver Fields */}
                                  {detectedDrivers.length > 0 && (
                                    <>
                                      <div className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50">
                                        Additional Drivers
                                      </div>
                                      {availableFields.filter(f => f.category === 'driver').map((field) => (
                                        <SelectItem key={field.value} value={field.value}>
                                          {field.label}
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}

                                  {/* Vehicle Fields */}
                                  <div className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50">
                                    Vehicle Information
                                  </div>
                                  {availableFields.filter(f => f.category === 'vehicle').map((field) => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label}
                                    </SelectItem>
                                  ))}

                                  {/* General Fields */}
                                  <div className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                                    General Information
                                  </div>
                                  {availableFields.filter(f => f.category === 'general').map((field) => (
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
                </div>

                {/* Fixed button section at bottom */}
                <div className="flex justify-between pt-4 border-t flex-shrink-0">
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

          <TabsContent value="result" className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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
            </div>

            {/* Fixed button section at bottom */}
            <div className="flex justify-end pt-4 border-t flex-shrink-0">
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
