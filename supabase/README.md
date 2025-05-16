# Supabase Database Setup

This directory contains SQL files for setting up and configuring the Supabase database.

## How to Run SQL Files

1. Log in to the [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the SQL file
6. Run the query

## Files

### `create_ringcentral_tokens_table.sql`

This file creates the `ringcentral_tokens` table that is required for RingCentral authentication.
It also sets up the appropriate RLS policies to ensure users can only access their own tokens.

**Important**: Run this script first before using any RingCentral features.

### `get_database_info.sql`

This file creates a function that returns information about the database, including:
- Database version
- Table counts
- Schema information
- Row counts for each table

To use this function in your application:

```typescript
const { data, error } = await supabase.rpc('get_database_info');
```

### `get_simple_database_info.sql`

This file creates:
1. A view that returns the database version
2. A simple function to test the database connection

To use the view in your application:

```typescript
const { data, error } = await supabase.from('_version_info').select('*').single();
```

To test the connection:

```typescript
const { data, error } = await supabase.rpc('test_connection');
```

### `create_missing_tables.sql`

This file creates all the missing tables mentioned in the error logs and sets up the appropriate RLS policies.
Run this script to ensure all required tables exist in your Supabase database.

## Required Tables

The following tables should be created in your Supabase database:

1. `ringcentral_tokens` - Stores RingCentral authentication tokens
   - `user_id` (primary key, references auth.users.id)
   - `access_token` (text)
   - `refresh_token` (text)
   - `token_type` (text)
   - `expires_at` (timestamp)
   - `scope` (text)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. `specialty_items` - Stores specialty items for insurance
   - `id` (primary key)
   - `name` (text)
   - `value` (numeric)
   - `user_id` (references auth.users.id)

3. `other_insureds` - Stores information about other insureds
   - `id` (primary key)
   - `name` (text)
   - `relationship` (text)
   - `user_id` (references auth.users.id)

4. `vehicles` - Stores vehicle information
   - `id` (primary key)
   - `make` (text)
   - `model` (text)
   - `year` (integer)
   - `vin` (text)
   - `user_id` (references auth.users.id)

5. `homes` - Stores home information
   - `id` (primary key)
   - `address` (text)
   - `city` (text)
   - `state` (text)
   - `zip` (text)
   - `year_built` (integer)
   - `user_id` (references auth.users.id)

## Row Level Security (RLS) Policies

Make sure to set up appropriate RLS policies for each table to ensure users can only access their own data.

Example policy for the `ringcentral_tokens` table:

```sql
CREATE POLICY "Users can only access their own tokens"
ON ringcentral_tokens
FOR ALL
USING (auth.uid() = user_id);
```
