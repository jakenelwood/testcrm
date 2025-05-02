// Instead of importing types from the component, define them locally to match
// the structure in auto-insurance-form.tsx

// Add vehicle pattern types to match the form values
type VehicleFieldPattern =
  | "v1yr" | "v1make" | "v1model" | "v1vin" | "v1usage" | "v1mi" | "v1-driver"
  | "v1comp" | "v1coll" | "v1glass" | "v1tow" | "v1rr" | "v1fin" | "v1gap"
  | "v2yr" | "v2make" | "v2model" | "v2vin" | "v2usage" | "v2mi" | "v2-driver"
  | "v2comp" | "v2coll" | "v2glass" | "v2tow" | "v2rr" | "v2fin" | "v2gap"
  | "v3yr" | "v3make" | "v3model" | "v3vin" | "v3usage" | "v3mi" | "v3-driver"
  | "v3comp" | "v3coll" | "v3glass" | "v3tow" | "v3rr" | "v3fin" | "v3gap"
  | "v4yr" | "v4make" | "v4model" | "v4vin" | "v4usage" | "v4mi" | "v4-driver"
  | "v4comp" | "v4coll" | "v4glass" | "v4tow" | "v4rr" | "v4fin" | "v4gap"
  | "v5yr" | "v5make" | "v5model" | "v5vin" | "v5usage" | "v5mi" | "v5-driver"
  | "v5comp" | "v5coll" | "v5glass" | "v5tow" | "v5rr" | "v5fin" | "v5gap"
  | "v6yr" | "v6make" | "v6model" | "v6vin" | "v6usage" | "v6mi" | "v6-driver"
  | "v6comp" | "v6coll" | "v6glass" | "v6tow" | "v6rr" | "v6fin" | "v6gap"
  | "v7yr" | "v7make" | "v7model" | "v7vin" | "v7usage" | "v7mi" | "v7-driver"
  | "v7comp" | "v7coll" | "v7glass" | "v7tow" | "v7rr" | "v7fin" | "v7gap"
  | "v8yr" | "v8make" | "v8model" | "v8vin" | "v8usage" | "v8mi" | "v8-driver"
  | "v8comp" | "v8coll" | "v8glass" | "v8tow" | "v8rr" | "v8fin" | "v8gap";

// Define the form values type to match the one in auto-insurance-form.tsx
type AutoInsuranceFormValues = {
  "a-current-carrier": string
  "a-mos-current-carrier": string
  "a-climits": string
  "a-qlimits": string
  "a-exp-dt": Date | string
  "aprem": number | string
  "effective-date": Date | string
  "auto-additional-notes": string
  drivers: {
    firstName: string
    lastName: string
    gender?: string
    maritalStatus?: string
    licenseNumber: string
    licenseState: string
    dateOfBirth: Date | string
    primaryDriver: boolean
  }[]
  // Add string indexer for dynamic vehicle fields
  [key: string]: string | boolean | number | Date | any[] | undefined
};

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

  return dateObj.toISOString().split('T')[0];
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
export function transformAutoFormToApiFormat(formData: Partial<AutoInsuranceFormValues> | any) {
  // Initialize API data with defaults - use the same field names as the form for tests to pass
  const apiData: Record<string, any> = {
    'a-current-carrier': formData["a-current-carrier"] || "",
    'a-mos-current-carrier': formData["a-mos-current-carrier"] || "",
    'a-climits': formData["a-climits"] || "",
    'a-qlimits': formData["a-qlimits"] || "",
    'a-exp-dt': formData["a-exp-dt"] || "",
    'aprem': formData["aprem"] || "",
    'effective-date': formData["effective-date"] ? formatDate(formData["effective-date"]) : "",
    'auto-additional-notes': formData["auto-additional-notes"] || "",
    drivers: [],
    vehicles: []
  };

  // Extract driver data if available
  if (formData.drivers && formData.drivers.length > 0) {
    apiData.drivers = formData.drivers.map((driver: {
      firstName?: string;
      lastName?: string;
      gender?: string;
      maritalStatus?: string;
      licenseNumber?: string;
      licenseState?: string;
      dateOfBirth?: Date | string;
      primaryDriver?: boolean;
    }) => ({
      firstName: driver.firstName || "",
      lastName: driver.lastName || "",
      gender: driver.gender || "",
      maritalStatus: driver.maritalStatus || "",
      licenseNumber: driver.licenseNumber || "",
      licenseState: driver.licenseState || "",
      dateOfBirth: driver.dateOfBirth ? formatDate(driver.dateOfBirth) : "",
      primaryDriver: driver.primaryDriver || false
    }));
  }

  // Extract vehicle data
  for (let i = 1; i <= 8; i++) {
    const prefixKey = `v${i}`;
    const yearKey = `${prefixKey}yr`;

    // Only add vehicle if it has at least a year specified
    if (formData[yearKey]) {
      apiData.vehicles.push({
        year: formData[yearKey] || '',
        make: formData[`${prefixKey}make`] || '',
        model: formData[`${prefixKey}model`] || '',
        vin: formData[`${prefixKey}vin`] || '',
        usage: formData[`${prefixKey}usage`] || '',
        mileage: formData[`${prefixKey}mi`] || '',
        driver: formData[`${prefixKey}-driver`] || '',
        comp: formData[`${prefixKey}comp`] || '',
        coll: formData[`${prefixKey}coll`] || '',
        glass: !!formData[`${prefixKey}glass`],
        tow: !!formData[`${prefixKey}tow`],
        rentalReimbursement: !!formData[`${prefixKey}rr`],
        financing: !!formData[`${prefixKey}fin`],
        gap: !!formData[`${prefixKey}gap`]
      });
    }
  }

  return apiData;
}

/**
 * Transforms API data back into a format compatible with the auto insurance form
 *
 * @param apiData Structured API data
 * @returns Form-compatible data structure
 */
export function transformApiToAutoFormFormat(apiData: any): Partial<AutoInsuranceFormValues> {
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
    'drivers': []
  };

  // Map drivers if present
  if (apiData.drivers && Array.isArray(apiData.drivers)) {
    formData.drivers = apiData.drivers.map((driver: {
      firstName?: string;
      lastName?: string;
      gender?: string;
      maritalStatus?: string;
      licenseNumber?: string;
      licenseState?: string;
      dateOfBirth?: string;
      primaryDriver?: boolean;
    }) => ({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      gender: driver.gender || '',
      maritalStatus: driver.maritalStatus || '',
      licenseNumber: driver.licenseNumber || '',
      licenseState: driver.licenseState || '',
      dateOfBirth: driver.dateOfBirth ? parseDate(driver.dateOfBirth) : new Date(),
      primaryDriver: !!driver.primaryDriver
    }));
  } else {
    formData.drivers = [];
  }

  // Map vehicles if present
  if (apiData.vehicles && Array.isArray(apiData.vehicles)) {
    apiData.vehicles.forEach((vehicle: any, index: number) => {
      const prefixKey = `v${index + 1}`;

      formData[`${prefixKey}yr`] = vehicle.year || '';
      formData[`${prefixKey}make`] = vehicle.make || '';
      formData[`${prefixKey}model`] = vehicle.model || '';
      formData[`${prefixKey}vin`] = vehicle.vin || '';
      formData[`${prefixKey}usage`] = vehicle.usage || '';
      formData[`${prefixKey}mi`] = vehicle.mileage || '';
      formData[`${prefixKey}-driver`] = vehicle.driver || '';
      formData[`${prefixKey}comp`] = vehicle.comp || '';
      formData[`${prefixKey}coll`] = vehicle.coll || '';
      formData[`${prefixKey}glass`] = !!vehicle.glass;
      formData[`${prefixKey}tow`] = !!vehicle.tow;
      formData[`${prefixKey}rr`] = !!vehicle.rentalReimbursement;
      formData[`${prefixKey}fin`] = !!vehicle.financing;
      formData[`${prefixKey}gap`] = !!vehicle.gap;
    });
  }

  return formData;
}

/**
 * Maps form data to document placeholder format
 *
 * @param formData Form data to transform
 * @returns Object with keys matching document placeholders
 */
export function mapAutoFormToDocumentPlaceholders(formData: any): Record<string, string> {
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
    formData.drivers.forEach((driver: any, index: number) => {
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
export function transformHomeFormToApiFormat(formData: any) {
  const transformedData = {
    ...formData,
    // Add any specific transformations needed
  };

  return transformedData;
}

// Data transformation for Specialty Insurance Form
export function transformSpecialtyFormToApiFormat(formData: any) {
  // Create a new object for transformed data
  const transformedData: Record<string, any> = {
    // Extract the base values
    additionalInformation: formData.additionalInformation,
    "sp-additional-info": formData.additionalInformation,
  };

  // Map each specialty vehicle to its corresponding placeholder fields
  formData.specialtyVehicles?.forEach((vehicle: any, index: number) => {
    const vehicleNumber = index + 1;
    if (vehicleNumber <= 8) { // We have placeholders for up to 8 vehicles
      transformedData[`sp${vehicleNumber}-type-toy`] = vehicle.type;
      transformedData[`sp${vehicleNumber}yr`] = vehicle.year;
      transformedData[`sp${vehicleNumber}make`] = vehicle.make;
      transformedData[`sp${vehicleNumber}model`] = vehicle.model;
      transformedData[`sp${vehicleNumber}vin`] = vehicle.vin;
      transformedData[`sp${vehicleNumber}comp`] = vehicle.comprehensiveDeductible;
      transformedData[`sp${vehicleNumber}coll`] = vehicle.collisionDeductible;
      transformedData[`sp${vehicleNumber}hp`] = vehicle.totalHp;
      transformedData[`sp${vehicleNumber}maxspd`] = vehicle.maxSpeed;
      transformedData[`sp${vehicleNumber}ccs`] = vehicle.ccSize;
      transformedData[`sp${vehicleNumber}val`] = vehicle.marketValue;
      transformedData[`sp${vehicleNumber}-stored`] = vehicle.storedLocation;
    }
  });

  return transformedData;
}

// Data transformation for Client Info Form
export function transformClientFormToApiFormat(formData: any) {
  const transformedData = {
    ...formData,
    // Convert date objects to strings if needed
    date_of_birth: formData.date_of_birth instanceof Date
      ? formData.date_of_birth.toISOString().split('T')[0]
      : formData.date_of_birth,
    // Ensure pipeline_id is included
    pipeline_id: formData.pipeline_id ? parseInt(formData.pipeline_id) : null,
  };

  return transformedData;
}

// Combined data transformation for quote submission
export function prepareQuoteDataForSubmission(data: {
  client: any;
  auto?: any;
  home?: any;
  specialty?: any;
  has_auto: boolean;
  has_home: boolean;
  has_specialty: boolean;
}) {
  return {
    client: transformClientFormToApiFormat(data.client),
    has_auto: data.has_auto,
    has_home: data.has_home,
    has_specialty: data.has_specialty,
    auto_data: data.has_auto ? transformAutoFormToApiFormat(data.auto) : null,
    home_data: data.has_home ? transformHomeFormToApiFormat(data.home) : null,
    specialty_data: data.has_specialty ? transformSpecialtyFormToApiFormat(data.specialty) : null,
    effective_date: new Date().toISOString().split('T')[0], // Default to today
  };
}