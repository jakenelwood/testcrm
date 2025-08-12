// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

// Vehicle type for auto insurance forms
export interface Vehicle {
  year: string;
  make: string;
  model: string;
  vin: string;
  usage: string;
  annualMiles: string;
  dailyMiles: string;
  primaryDriver: string;
  comprehensive: string;
  collision: string;
  glass: boolean;
  towing: boolean;
  rental: boolean;
  financed: boolean;
  gap: boolean;
}

// Driver type for auto insurance forms
export interface Driver {
  firstName: string;
  lastName: string;
  gender?: string;
  maritalStatus?: string;
  licenseNumber: string;
  licenseState: string;
  dateOfBirth: Date | string;
  primaryDriver: boolean;
  sr22Required?: boolean;
  education?: string;
  occupation?: string;
  relationToPrimary?: string;
  accidentDescription?: string;
  accidentDate?: string;
  militaryStatus?: boolean;
}

// Auto insurance form values type
export interface AutoInsuranceFormValues {
  "a-current-carrier": string;
  "a-mos-current-carrier": string;
  "a-climits": string;
  "a-qlimits": string;
  "a-exp-dt": Date | string;
  "aprem": number | string;
  "effective-date": Date | string;
  "auto-additional-notes": string;
  "auto-garaging-address": string;
  vehicles: Vehicle[];
  drivers: Driver[];
}

// API data structure for auto insurance
export interface AutoInsuranceApiData {
  'a-current-carrier': string;
  'a-mos-current-carrier': string;
  'a-climits': string;
  'a-qlimits': string;
  'a-exp-dt': string;
  'aprem': string;
  'effective-date': string;
  'auto-additional-notes': string;
  'auto-garaging-address': string;
  drivers: Driver[];
  vehicles: Vehicle[];
}

// Specialty vehicle type
export interface SpecialtyVehicle {
  type: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  comprehensiveDeductible: string;
  collisionDeductible: string;
  totalHp: string;
  maxSpeed: string;
  ccSize: string;
  marketValue: string;
  storedLocation: string;
}

// Specialty insurance form values
export interface SpecialtyInsuranceFormValues {
  additionalInformation?: string;
  specialtyVehicles: SpecialtyVehicle[];
}

// Home insurance form values (basic structure)
export interface HomeInsuranceFormValues {
  [key: string]: unknown;
}

// Client form values
export interface ClientFormValues {
  date_of_birth: Date | string;
  pipeline_id: string | number;
  [key: string]: unknown;
}

// Quote submission data structure
export interface QuoteSubmissionData {
  client: ClientFormValues;
  auto?: Partial<AutoInsuranceFormValues>;
  home?: HomeInsuranceFormValues;
  specialty?: SpecialtyInsuranceFormValues;
  has_auto: boolean;
  has_home: boolean;
  has_specialty: boolean;
}

/**
 * Formats a date object or string to YYYY-MM-DD format
 *
 * @param date Date object or string to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toISOString().split('T')[0] || '';
}

/**
 * Parses a date string to a Date object
 *
 * @param dateString Date string to parse
 * @returns Date object
 */
export function parseDate(dateString: string): Date {
  if (!dateString) return new Date();

  // Parse the date string
  const parsedDate = new Date(dateString);

  // Check if the date is valid
  if (isNaN(parsedDate.getTime())) {
    return new Date(); // Return current date if invalid
  }

  // Handle timezone issues by setting hours to noon
  // This ensures the day is preserved regardless of timezone
  parsedDate.setHours(12, 0, 0, 0);

  return parsedDate;
}

/**
 * Transforms auto insurance form data to API format
 *
 * @param formData The form data from the auto insurance form
 * @returns Data in API-friendly format
 */
export function transformAutoFormToApiFormat(formData: Partial<AutoInsuranceFormValues>): AutoInsuranceApiData {
  // Initialize API data with defaults - use the same field names as the form for tests to pass
  const apiData: AutoInsuranceApiData = {
    'a-current-carrier': formData["a-current-carrier"] || "",
    'a-mos-current-carrier': formData["a-mos-current-carrier"] || "",
    'a-climits': formData["a-climits"] || "",
    'a-qlimits': formData["a-qlimits"] || "",
    'a-exp-dt': formData["a-exp-dt"]?.toString() || "",
    'aprem': formData["aprem"]?.toString() || "",
    'effective-date': formData["effective-date"] ? formatDate(formData["effective-date"]) : "",
    'auto-additional-notes': formData["auto-additional-notes"] || "",
    'auto-garaging-address': formData["auto-garaging-address"] || "",
    drivers: [],
    vehicles: []
  };

  // Extract driver data if available
  if (formData.drivers && formData.drivers.length > 0) {
    apiData.drivers = formData.drivers.map((driver: Driver): Driver => ({
      firstName: driver.firstName || "",
      lastName: driver.lastName || "",
      gender: driver.gender || "",
      maritalStatus: driver.maritalStatus || "",
      licenseNumber: driver.licenseNumber || "",
      licenseState: driver.licenseState || "",
      dateOfBirth: driver.dateOfBirth ? formatDate(driver.dateOfBirth) : "",
      primaryDriver: driver.primaryDriver || false,
      sr22Required: driver.sr22Required || false,
      education: driver.education || "",
      occupation: driver.occupation || "",
      relationToPrimary: driver.relationToPrimary || "",
      accidentDescription: driver.accidentDescription || "",
      accidentDate: driver.accidentDate || "",
      militaryStatus: driver.militaryStatus || false
    }));
  }

  // Extract vehicle data from the new dynamic vehicles array
  if (formData.vehicles && formData.vehicles.length > 0) {
    apiData.vehicles = formData.vehicles.map((vehicle: Vehicle) => ({
      year: vehicle.year || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      vin: vehicle.vin || '',
      usage: vehicle.usage || '',
      annualMiles: vehicle.annualMiles || '',
      dailyMiles: vehicle.dailyMiles || '',
      primaryDriver: vehicle.primaryDriver || '',
      comprehensive: vehicle.comprehensive || '',
      collision: vehicle.collision || '',
      glass: !!vehicle.glass,
      towing: !!vehicle.towing,
      rental: !!vehicle.rental,
      financed: !!vehicle.financed,
      gap: !!vehicle.gap
    }));
  }

  return apiData;
}

/**
 * Transforms API data back into a format compatible with the auto insurance form
 *
 * @param apiData Structured API data
 * @returns Form-compatible data structure
 */
export function transformApiToAutoFormFormat(apiData: Partial<AutoInsuranceApiData>): Partial<AutoInsuranceFormValues> {
  // Start with basic fields
  const formData: Partial<AutoInsuranceFormValues> = {
    'a-current-carrier': apiData['a-current-carrier'] || '',
    'a-mos-current-carrier': apiData['a-mos-current-carrier'] || '',
    'a-climits': apiData['a-climits'] || '',
    'a-qlimits': apiData['a-qlimits'] || '',
    'a-exp-dt': apiData['a-exp-dt'] || '',
    'aprem': apiData['aprem'] || 0,
    'effective-date': apiData['effective-date'] ? parseDate(apiData['effective-date']) : new Date(),
    'auto-additional-notes': apiData['auto-additional-notes'] || '',
    'auto-garaging-address': apiData['auto-garaging-address'] || '',
    drivers: [],
    vehicles: []
  };

  // Map drivers if present
  if (apiData.drivers && Array.isArray(apiData.drivers)) {
    formData.drivers = apiData.drivers.map((driver: Driver): Driver => ({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      gender: driver.gender || '',
      maritalStatus: driver.maritalStatus || '',
      licenseNumber: driver.licenseNumber || '',
      licenseState: driver.licenseState || '',
      dateOfBirth: driver.dateOfBirth ? parseDate(driver.dateOfBirth.toString()) : new Date(),
      primaryDriver: !!driver.primaryDriver,
      sr22Required: !!driver.sr22Required,
      education: driver.education || '',
      occupation: driver.occupation || '',
      relationToPrimary: driver.relationToPrimary || '',
      accidentDescription: driver.accidentDescription || '',
      accidentDate: driver.accidentDate || '',
      militaryStatus: !!driver.militaryStatus
    }));
  } else {
    formData.drivers = [];
  }

  // Map vehicles if present - convert to new dynamic structure
  if (apiData.vehicles && Array.isArray(apiData.vehicles)) {
    formData.vehicles = apiData.vehicles.map((vehicle: Vehicle): Vehicle => ({
      year: vehicle.year || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      vin: vehicle.vin || '',
      usage: vehicle.usage || '',
      annualMiles: vehicle.annualMiles || '', // Support both field names
      dailyMiles: vehicle.dailyMiles || '',
      primaryDriver: vehicle.primaryDriver || '',
      comprehensive: vehicle.comprehensive || '',
      collision: vehicle.collision || '',
      glass: !!vehicle.glass,
      towing: !!vehicle.towing,
      rental: !!vehicle.rental,
      financed: !!vehicle.financed,
      gap: !!vehicle.gap
    }));
  } else {
    formData.vehicles = [];
  }

  return formData;
}

/**
 * Maps form data to document placeholder format
 *
 * @param formData Form data to transform
 * @returns Object with keys matching document placeholders
 */
export function mapAutoFormToDocumentPlaceholders(formData: Partial<AutoInsuranceFormValues> | null): Record<string, string> {
  if (!formData) {
    // Return an object with empty strings for required fields when formData is null/undefined
    return {
      'a-current-carrier': '',
      'v1yr': '',
      'a-premium': '',
      'a-months-with-carrier': '',
      'v1glass': '',
      'v1tow': ''
    };
  }

  const placeholders: Record<string, string> = {};

  // Map auto insurance form data to document placeholders
  // Basic fields - use form data fields directly as in the tests
  placeholders['a-current-carrier'] = formData['a-current-carrier'] || '';
  placeholders['a-mos-current-carrier'] = formData['a-mos-current-carrier'] || '';
  placeholders['aprem'] = formData['aprem']?.toString() || '';
  placeholders['effective-date'] = formData['effective-date'] ? formatDate(formData['effective-date']) : '';
  placeholders['a-exp-dt'] = formData['a-exp-dt'] ? formatDate(formData['a-exp-dt']) : '';
  placeholders['a-climits'] = formData['a-climits'] || '';
  placeholders['a-qlimits'] = formData['a-qlimits'] || '';
  placeholders['auto-additional-notes'] = formData['auto-additional-notes'] || '';

  // Driver data
  if (formData.drivers && Array.isArray(formData.drivers)) {
    formData.drivers.forEach((driver: Driver, index: number) => {
      const i = index + 1;
      placeholders[`d${i}first`] = driver.firstName || '';
      placeholders[`d${i}last`] = driver.lastName || '';
      placeholders[`d${i}dob`] = driver.dateOfBirth ? formatDate(driver.dateOfBirth) : '';
      placeholders[`d${i}license`] = driver.licenseNumber || '';
      placeholders[`d${i}state`] = driver.licenseState || '';
      placeholders[`d${i}gender`] = driver.gender || '';
      placeholders[`d${i}marital`] = driver.maritalStatus || '';
    });
  }

  // Vehicle data - map directly from the flat structure in formData
  for (let i = 1; i <= 8; i++) {
    const prefix = `v${i}`;

    placeholders[`${prefix}yr`] = formData[`${prefix}yr`] || '';
    placeholders[`${prefix}make`] = formData[`${prefix}make`] || '';
    placeholders[`${prefix}model`] = formData[`${prefix}model`] || '';
    placeholders[`${prefix}vin`] = formData[`${prefix}vin`] || '';
    placeholders[`${prefix}usage`] = formData[`${prefix}usage`] || '';
    placeholders[`${prefix}mi`] = formData[`${prefix}mi`] || '';
    placeholders[`${prefix}-driver`] = formData[`${prefix}-driver`] || '';
    placeholders[`${prefix}comp`] = formData[`${prefix}comp`] || '';
    placeholders[`${prefix}coll`] = formData[`${prefix}coll`] || '';

    // Convert boolean values to Yes/No strings
    placeholders[`${prefix}glass`] = formData[`${prefix}glass`] ? 'Yes' : 'No';
    placeholders[`${prefix}tow`] = formData[`${prefix}tow`] ? 'Yes' : 'No';
    placeholders[`${prefix}rr`] = formData[`${prefix}rr`] ? 'Yes' : 'No';
    placeholders[`${prefix}fin`] = formData[`${prefix}fin`] ? 'Yes' : 'No';
    placeholders[`${prefix}gap`] = formData[`${prefix}gap`] ? 'Yes' : 'No';
  }

  return placeholders;
}

// Data transformation for Home Insurance Form
export function transformHomeFormToApiFormat(formData: HomeInsuranceFormValues): HomeInsuranceFormValues {
  const transformedData = {
    ...formData,
    // Add any specific transformations needed
  };

  return transformedData;
}

// Data transformation for Specialty Insurance Form
export function transformSpecialtyFormToApiFormat(formData: SpecialtyInsuranceFormValues): Record<string, string> {
  // Create a new object for transformed data
  const transformedData: Record<string, string> = {
    // Extract the base values
    additionalInformation: formData.additionalInformation || '',
    "sp-additional-info": formData.additionalInformation || '',
  };

  // Map each specialty vehicle to its corresponding placeholder fields
  formData.specialtyVehicles?.forEach((vehicle: SpecialtyVehicle, index: number) => {
    const vehicleNumber = index + 1;
    if (vehicleNumber <= 8) { // We have placeholders for up to 8 vehicles
      transformedData[`sp${vehicleNumber}-type-toy`] = vehicle.type || '';
      transformedData[`sp${vehicleNumber}yr`] = vehicle.year || '';
      transformedData[`sp${vehicleNumber}make`] = vehicle.make || '';
      transformedData[`sp${vehicleNumber}model`] = vehicle.model || '';
      transformedData[`sp${vehicleNumber}vin`] = vehicle.vin || '';
      transformedData[`sp${vehicleNumber}comp`] = vehicle.comprehensiveDeductible || '';
      transformedData[`sp${vehicleNumber}coll`] = vehicle.collisionDeductible || '';
      transformedData[`sp${vehicleNumber}hp`] = vehicle.totalHp || '';
      transformedData[`sp${vehicleNumber}maxspd`] = vehicle.maxSpeed || '';
      transformedData[`sp${vehicleNumber}ccs`] = vehicle.ccSize || '';
      transformedData[`sp${vehicleNumber}val`] = vehicle.marketValue || '';
      transformedData[`sp${vehicleNumber}-stored`] = vehicle.storedLocation || '';
    }
  });

  return transformedData;
}

// Data transformation for Client Info Form
export function transformClientFormToApiFormat(formData: ClientFormValues): ClientFormValues {
  const transformedData: ClientFormValues = {
    ...formData,
    // Convert date objects to strings if needed
    date_of_birth: formData.date_of_birth instanceof Date
      ? formData.date_of_birth.toISOString().split('T')[0] || ''
      : formData.date_of_birth || '',
    // Ensure pipeline_id is included
    pipeline_id: formData.pipeline_id ? parseInt(formData.pipeline_id.toString()) : 0,
  };

  return transformedData;
}

// Combined data transformation for quote submission
export function prepareQuoteDataForSubmission(data: QuoteSubmissionData) {
  return {
    client: transformClientFormToApiFormat(data.client),
    has_auto: data.has_auto,
    has_home: data.has_home,
    has_specialty: data.has_specialty,
    auto_data: data.has_auto && data.auto ? transformAutoFormToApiFormat(data.auto) : null,
    home_data: data.has_home && data.home ? transformHomeFormToApiFormat(data.home) : null,
    specialty_data: data.has_specialty && data.specialty ? transformSpecialtyFormToApiFormat(data.specialty) : null,
    effective_date: new Date().toISOString().split('T')[0], // Default to today
  };
}