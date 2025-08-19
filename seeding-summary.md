# 🌱 Schema-Aware Seeding Results

Generated: 2025-08-14T04:39:42.192Z

## 📊 Summary
- **Total Tables**: 9
- **Records Created**: 0
- **Records Failed**: 284
- **Success Rate**: 0.0%
- **Total Execution Time**: 4627ms

## 📋 Seeding Results by Table


### users
- **Records Created**: 0
- **Records Failed**: 20
- **Execution Time**: 1193ms
- **Errors**: Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date


### insurance_types
- **Records Created**: 0
- **Records Failed**: 16
- **Execution Time**: 992ms
- **Errors**: Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date, Record 0: TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date


### addresses
- **Records Created**: 0
- **Records Failed**: 40
- **Execution Time**: 2440ms
- **Errors**: Record 0: PostgresError: column "line1" of relation "addresses" does not exist, Record 0: PostgresError: current transaction is aborted, commands ignored until end of transaction block, Record 0: PostgresError: current transaction is aborted, commands ignored until end of transaction block, Record 0: PostgresError: current transaction is aborted, commands ignored until end of transaction block, Record 0: PostgresError: current transaction is aborted, commands ignored until end of transaction block


### pipelines
- **Records Created**: 0
- **Records Failed**: 3
- **Execution Time**: 0ms
- **Errors**: Generation failed: Error: Cannot get value from empty dataset.


### pipeline_statuses
- **Records Created**: 0
- **Records Failed**: 0
- **Execution Time**: 0ms
- **Errors**: None


### leads
- **Records Created**: 0
- **Records Failed**: 50
- **Execution Time**: 1ms
- **Errors**: Generation failed: Error: Cannot get value from empty dataset.


### clients
- **Records Created**: 0
- **Records Failed**: 25
- **Execution Time**: 0ms
- **Errors**: Generation failed: Error: Cannot get value from empty dataset.


### communications
- **Records Created**: 0
- **Records Failed**: 100
- **Execution Time**: 0ms
- **Errors**: Generation failed: Error: Cannot get value from empty dataset.


### quotes
- **Records Created**: 0
- **Records Failed**: 30
- **Execution Time**: 1ms
- **Errors**: Generation failed: Error: Cannot get value from empty dataset.


## 🎯 Next Steps

1. **Review Failed Records**: Investigate any failed record insertions
2. **Validate Data Quality**: Run data quality checks on populated data
3. **Test Application**: Verify application works with populated data
4. **Performance Testing**: Test application performance with realistic data volumes
