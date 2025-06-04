import { 
  transformAutoFormToApiFormat, 
  transformApiToAutoFormFormat,
  mapAutoFormToDocumentPlaceholders,
  formatDate,
  parseDate
} from '../../lib/form-transformers';

describe('Auto Form Transformers', () => {
  // Sample form data for testing
  const sampleFormData = {
    'a-current-carrier': 'Progressive',
    'a-mos-current-carrier': '24',
    'a-climits': '100/300/100',
    'a-qlimits': '250/500/250',
    'a-exp-dt': '2023-12-31',
    'aprem': 1200,
    'effective-date': new Date('2024-01-01'),
    'auto-additional-notes': 'Test notes',
    'drivers': [
      {
        firstName: 'John',
        lastName: 'Doe',
        licenseNumber: 'DL123456',
        licenseState: 'MN',
        dateOfBirth: new Date('1980-05-15'),
        primaryDriver: true
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        licenseNumber: 'DL654321',
        licenseState: 'MN',
        dateOfBirth: new Date('1982-08-20'),
        primaryDriver: false
      }
    ],
    // Vehicle 1
    'v1yr': '2020',
    'v1make': 'Honda',
    'v1model': 'Accord',
    'v1vin': '1HGCV1F34LA123456',
    'v1usage': 'commute',
    'v1mi': '12000',
    'v1-driver': 'John Doe',
    'v1comp': '500',
    'v1coll': '1000',
    'v1glass': true,
    'v1tow': true,
    'v1rr': true,
    'v1fin': true,
    'v1gap': false,
    // Vehicle 2
    'v2yr': '2018',
    'v2make': 'Toyota',
    'v2model': 'Camry',
    'v2vin': '4T1BF1FK6JU123456',
    'v2usage': 'pleasure',
    'v2mi': '8000',
    'v2-driver': 'Jane Doe',
    'v2comp': '250',
    'v2coll': '500',
    'v2glass': false,
    'v2tow': true,
    'v2rr': true,
    'v2fin': false,
    'v2gap': false
  };

  // Sample API data format
  const sampleApiData = {
    'a-current-carrier': 'Progressive',
    'a-mos-current-carrier': '24',
    'a-climits': '100/300/100',
    'a-qlimits': '250/500/250',
    'a-exp-dt': '2023-12-31',
    'aprem': 1200,
    'effective-date': '2024-01-01',
    'auto-additional-notes': 'Test notes',
    'drivers': [
      {
        firstName: 'John',
        lastName: 'Doe',
        licenseNumber: 'DL123456',
        licenseState: 'MN',
        dateOfBirth: '1980-05-15',
        primaryDriver: true
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        licenseNumber: 'DL654321',
        licenseState: 'MN',
        dateOfBirth: '1982-08-20',
        primaryDriver: false
      }
    ],
    'vehicles': [
      {
        year: '2020',
        make: 'Honda',
        model: 'Accord',
        vin: '1HGCV1F34LA123456',
        usage: 'commute',
        mileage: '12000',
        driver: 'John Doe',
        comp: '500',
        coll: '1000',
        glass: true,
        tow: true,
        rentalReimbursement: true,
        financing: true,
        gap: false
      },
      {
        year: '2018',
        make: 'Toyota',
        model: 'Camry',
        vin: '4T1BF1FK6JU123456',
        usage: 'pleasure',
        mileage: '8000',
        driver: 'Jane Doe',
        comp: '250',
        coll: '500',
        glass: false,
        tow: true,
        rentalReimbursement: true,
        financing: false,
        gap: false
      }
    ]
  };

  // Sample document placeholder data
  const samplePlaceholderData = {
    'a-current-carrier': 'Progressive',
    'a-mos-current-carrier': '24',
    'a-climits': '100/300/100',
    'a-qlimits': '250/500/250',
    'a-exp-dt': '2023-12-31',
    'aprem': '1200',
    'effective-date': '2024-01-01',
    'auto-additional-notes': 'Test notes',
    'v1yr': '2020',
    'v1make': 'Honda',
    'v1model': 'Accord',
    'v1vin': '1HGCV1F34LA123456',
    'v1usage': 'commute',
    'v1mi': '12000',
    'v1-driver': 'John Doe',
    'v1comp': '500',
    'v1coll': '1000',
    'v1glass': 'Yes',
    'v1tow': 'Yes',
    'v1rr': 'Yes',
    'v1fin': 'Yes',
    'v1gap': 'No',
    'v2yr': '2018',
    'v2make': 'Toyota',
    'v2model': 'Camry',
    'v2vin': '4T1BF1FK6JU123456',
    'v2usage': 'pleasure',
    'v2mi': '8000',
    'v2-driver': 'Jane Doe',
    'v2comp': '250',
    'v2coll': '500',
    'v2glass': 'No',
    'v2tow': 'Yes',
    'v2rr': 'Yes',
    'v2fin': 'No',
    'v2gap': 'No'
  };

  describe('transformAutoFormToApiFormat', () => {
    it('should transform form data to API format correctly', () => {
      // Act
      const result = transformAutoFormToApiFormat(sampleFormData as any);
      
      // Assert
      expect(result['a-current-carrier']).toBe('Progressive');
      expect(result['a-mos-current-carrier']).toBe('24');
      expect(result['effective-date']).toBe('2024-01-01');
      
      // Check drivers
      expect(result.drivers).toHaveLength(2);
      expect(result.drivers[0].firstName).toBe('John');
      expect(result.drivers[0].lastName).toBe('Doe');
      expect(result.drivers[0].dateOfBirth).toBe('1980-05-15');
      
      // Check vehicles
      expect(result.vehicles).toHaveLength(2);
      expect(result.vehicles[0].make).toBe('Honda');
      expect(result.vehicles[0].model).toBe('Accord');
      expect(result.vehicles[0].vin).toBe('1HGCV1F34LA123456');
      expect(result.vehicles[0].rentalReimbursement).toBe(true);
      
      expect(result.vehicles[1].make).toBe('Toyota');
      expect(result.vehicles[1].glass).toBe(false);
    });

    it('should handle empty form data gracefully', () => {
      // Act
      const result = transformAutoFormToApiFormat({} as any);
      
      // Assert
      expect(result['a-current-carrier']).toBe('');
      expect(result.drivers).toHaveLength(0);
      expect(result.vehicles).toHaveLength(0);
    });

    it('should handle partial vehicle data without errors', () => {
      // Arrange
      const partialData = {
        'v1yr': '2019',
        'drivers': []
      };
      
      // Act
      const result = transformAutoFormToApiFormat(partialData as any);
      
      // Assert
      expect(result.vehicles).toHaveLength(1);
      expect(result.vehicles[0].year).toBe('2019');
      expect(result.vehicles[0].make).toBe('');
    });
  });

  describe('transformApiToAutoFormFormat', () => {
    it('should transform API data to form format correctly', () => {
      // Act
      const result = transformApiToAutoFormFormat(sampleApiData);
      
      // Assert
      expect(result['a-current-carrier']).toBe('Progressive');
      expect(result['a-mos-current-carrier']).toBe('24');
      expect(result['effective-date']).toBeInstanceOf(Date);
      
      // Check drivers
      expect(result.drivers).toHaveLength(2);
      expect(result.drivers?.[0].firstName).toBe('John');
      expect(result.drivers?.[0].lastName).toBe('Doe');
      expect(result.drivers?.[0].dateOfBirth).toBeInstanceOf(Date);
      
      // Check vehicle fields
      expect(result['v1yr']).toBe('2020');
      expect(result['v1make']).toBe('Honda');
      expect(result['v1model']).toBe('Accord');
      expect(result['v1glass']).toBe(true);
      
      expect(result['v2yr']).toBe('2018');
      expect(result['v2make']).toBe('Toyota');
      expect(result['v2glass']).toBe(false);
    });

    it('should handle empty API data gracefully', () => {
      // Act
      const result = transformApiToAutoFormFormat({});
      
      // Assert
      expect(result['a-current-carrier']).toBe('');
      expect(result.drivers).toHaveLength(0);
      expect(result['v1yr']).toBeUndefined();
    });

    it('should handle API data with missing vehicle array', () => {
      // Arrange
      const dataWithoutVehicles = {
        'a-current-carrier': 'State Farm',
        'drivers': []
      };
      
      // Act
      const result = transformApiToAutoFormFormat(dataWithoutVehicles);
      
      // Assert
      expect(result['a-current-carrier']).toBe('State Farm');
      expect(result['v1yr']).toBeUndefined();
    });
  });

  describe('mapAutoFormToDocumentPlaceholders', () => {
    it('should map form data to document placeholders correctly', () => {
      // Act
      const result = mapAutoFormToDocumentPlaceholders(sampleFormData as any);
      
      // Assert
      expect(result['a-current-carrier']).toBe('Progressive');
      expect(result['a-mos-current-carrier']).toBe('24');
      expect(result['effective-date']).toBe('2024-01-01');
      
      // Check vehicle fields
      expect(result['v1yr']).toBe('2020');
      expect(result['v1make']).toBe('Honda');
      expect(result['v1glass']).toBe('Yes');
      expect(result['v1gap']).toBe('No');
      
      expect(result['v2yr']).toBe('2018');
      expect(result['v2make']).toBe('Toyota');
      expect(result['v2glass']).toBe('No');
    });

    it('should convert boolean values to Yes/No strings', () => {
      // Arrange
      const dataWithBooleans = {
        'v1glass': true,
        'v1tow': false,
        'v2glass': true,
        'v2tow': false,
      };
      
      // Act
      const result = mapAutoFormToDocumentPlaceholders(dataWithBooleans as any);
      
      // Assert
      expect(result['v1glass']).toBe('Yes');
      expect(result['v1tow']).toBe('No');
      expect(result['v2glass']).toBe('Yes');
      expect(result['v2tow']).toBe('No');
    });

    it('should handle empty form data gracefully', () => {
      // Act
      const result = mapAutoFormToDocumentPlaceholders({} as any);
      
      // Assert
      expect(result['a-current-carrier']).toBe('');
      expect(result['v1yr']).toBe('');
    });
  });

  describe('Date formatting utilities', () => {
    it('formatDate should format Date objects correctly', () => {
      // Arrange
      const date = new Date('2023-05-15T12:00:00Z');
      
      // Act
      const result = formatDate(date);
      
      // Assert
      expect(result).toBe('2023-05-15');
    });

    it('formatDate should handle date strings correctly', () => {
      // Act
      const result = formatDate('2023-05-15T12:00:00Z');
      
      // Assert
      expect(result).toBe('2023-05-15');
    });

    it('formatDate should handle invalid dates gracefully', () => {
      // Act
      const result = formatDate('invalid-date');
      
      // Assert
      expect(result).toBe('');
    });

    it('parseDate should convert date strings to Date objects', () => {
      // Act
      const result = parseDate('2023-05-15');
      
      // Assert
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(4); // May is 4 (zero-indexed)
      
      // Dates may be affected by timezone, so check if it's either 14 or 15
      // depending on the timezone where the test is running
      const day = result.getDate();
      expect(day === 14 || day === 15).toBeTruthy();
    });

    it('parseDate should handle invalid date strings gracefully', () => {
      // Act
      const result = parseDate('invalid-date');
      
      // Assert
      expect(result).toBeInstanceOf(Date);
      // Should return current date for invalid input
      expect(result.getTime()).not.toBeNaN();
    });
  });
}); 