# Field Analysis: CSV vs Current Implementation

## CSV Fields Analysis (storage_fields.csv)

### Additional Insured Fields (JSON Fields)
- additional_insured_dl_number
- additional_insured_dob
- additional_insured_education
- additional_insured_occupation
- additional_insured_gender
- additional_insured_license_state
- additional_insured_marital_status
- additional_insured_name
- additional_insured_relation_to_primary_insured
- additional_insured_incident_accident_description
- additional_insured_incident_accident_date
- additional_insured_sr22
- additional_insured_military (Column)

### Auto Insurance Fields
**Columns:**
- auto_current_insurance_carrier_auto (Column)
- auto_months_with_current_carrier_auto (Column)
- auto_premium (Column)

**JSON Fields:**
- auto_additional_notes
- auto_garaging_address
- auto_current_limits
- auto_expiration_date
- auto_quoting_limits
- auto_vehicle_collision
- auto_vehicle_comp
- auto_vehicle_driver
- auto_vehicle_financed
- auto_vehicle_gap
- auto_vehicle_glass
- auto_vehicle_make
- auto_vehicle_annual_miles ⭐ (UPDATED from auto_vehicle_miles)
- auto_vehicle_daily_miles ⭐ (NEW)
- auto_vehicle_model
- auto_vehicle_rental_car_reimbursement
- auto_vehicle_tow
- auto_vehicle_usage
- auto_vehicle_vin
- auto_vehicle_year

### Home Insurance Fields
**Columns:**
- home_premium (Column)
- home_umbrella_uninsured_underinsured (Column)
- home_umbrella_value (Column)

**JSON Fields:**
- home_additional_notes
- home_number_of_bedrooms
- home_alarm
- home_attached_structures
- home_bankruptcy_foreclosure
- home_biting_pets
- home_business_type
- home_coverage_type_owner_renter
- home_current_insurance_carrier
- home_deck_size
- home_deck_type
- home_deductible
- home_detached_structures
- home_e_bikes_detail_type
- home_e_bikes_value
- home_electrical_type_amps
- home_electrical_year
- home_expiration_date
- home_fence_height
- home_fence_type
- home_fire_hydrant_distance
- home_fire_place
- home_flood_insurance
- home_form_type
- home_full_bath
- home_garage
- home_half_bath
- home_heating_system_type
- home_heating_system_year
- home_miles_from_fd
- home_months_with_current_carrier
- home_mortgage
- home_number_household_members
- home_percentage_finished_basement
- home_personal_property_value
- home_pets
- home_plumbing_material_type
- home_plumbing_year
- home_pool
- home_porch_size
- home_porch_type
- home_reconstruction_cost
- home_responding_fd
- home_roof_type
- home_roof_year_replaced
- home_scheduled_items_type
- home_scheduled_items_value
- home_septic_sewer
- home_service_line_limit
- home_siding_type
- home_sprinkled
- home_sq_ft_above_ground
- home_stories_style
- home_sump_pump_limit
- home_three_qtr_bath
- home_trampoline
- home_usage
- home_walk_out_basement
- home_wind_hail
- home_woodstove
- home_year_built
- home_claim_description
- home_claim_date

### Primary Named Insured Fields (Columns)
- primary_named_insured_address
- primary_named_insured_current_date
- primary_named_insured_dl_number
- primary_named_insured_dob
- primary_named_insured_occupation
- primary_named_insured_education
- primary_named_insured_effective_date
- primary_named_insured_email_address
- primary_named_insured_gender
- primary_named_insured_license_state
- primary_named_insured_mailing_address
- primary_named_insured_marital_status
- primary_named_insured_name
- primary_named_insured_phone_number
- primary_named_insured_prior_address
- primary_named_insured_referred_by
- primary_named_insured_relation_to_primary_insured
- primary_named_insured_rent_or_own
- primary_named_insured_incident_accident_description (JSON Field)
- primary_named_insured_incident_accident_date (JSON Field)
- primary_named_insured_sr22 (JSON Field)
- primary_named_insured_military (Column)

### Specialty Insurance Fields
**Columns:**
- specialty_additional_information
- specialty_cc_size
- specialty_collision_deductible
- specialty_comprehensive_deductible
- specialty_comprehensive_location_stored
- specialty_make
- specialty_market_value
- specialty_max_speed
- specialty_model
- specialty_premium
- specialty_total_hp
- specialty_type_toy
- specialty_vin
- specialty_year

**JSON Fields:**
- specialty_garaging_address

## Current Database Schema Status
✅ Database has JSONB fields (auto_data, home_data, specialty_data, additional_insureds) that can store all JSON fields
✅ Database has most required columns for fields marked as "Column" in CSV
⚠️ Need to verify all column fields are present in current schema

## Current Form Implementation Status

### Auto Insurance Form
✅ Basic fields covered (carrier, limits, premium, etc.)
✅ Vehicle details (year, make, model, VIN, usage, mileage)
✅ Coverage options (comp, collision, glass, tow, rental, gap)
⚠️ Missing: auto_vehicle_daily_miles (new field)
⚠️ Missing: auto_garaging_address
⚠️ Missing: auto_additional_notes

### Home Insurance Form  
⚠️ Very basic implementation - missing most detailed fields from CSV
❌ Missing majority of home insurance fields listed in CSV

### Specialty Insurance Form
✅ Good coverage of specialty vehicle fields
✅ Covers type, year, make, model, VIN, deductibles, etc.
⚠️ Missing: specialty_garaging_address

### Additional Insureds
❌ No current form implementation for additional insureds

## Next Steps Required
1. Update auto form to include missing fields
2. Significantly expand home insurance form
3. Add additional insureds form/section
4. Verify database column mappings
5. Update form data mapping to database
