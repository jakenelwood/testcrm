# Change Control Process

This document outlines the standard procedures for implementing, testing, and rolling back changes to both the codebase and database in the CRM project.

## Table of Contents

1. [GitHub Version Control](#github-version-control)
   - [Creating Feature Branches](#creating-feature-branches)
   - [Working on Features](#working-on-features)
   - [Testing Changes](#testing-changes)
   - [Code Review Process](#code-review-process)
   - [Merging to Main](#merging-to-main)
   - [Rolling Back Code Changes](#rolling-back-code-changes)

2. [Database Change Control](#database-change-control)
   - [Database Migration Process](#database-migration-process)
   - [Testing Database Changes](#testing-database-changes)
   - [Rolling Back Database Changes](#rolling-back-database-changes)
   - [Emergency Database Restoration](#emergency-database-restoration)

3. [Unified Change Process](#unified-change-process)
   - [Planning Changes](#planning-changes)
   - [Implementation Checklist](#implementation-checklist)
   - [Deployment Checklist](#deployment-checklist)
   - [Post-Deployment Verification](#post-deployment-verification)

---

## GitHub Version Control

### Creating Feature Branches

1. **Always branch from main**:
   ```bash
   # Ensure you have the latest main
   git checkout main
   git pull origin main
   
   # Create a new feature branch
   git checkout -b feature/descriptive-feature-name
   ```

2. **Naming conventions**:
   - `feature/` - For new features
   - `bugfix/` - For bug fixes
   - `hotfix/` - For critical fixes that need immediate deployment
   - `refactor/` - For code refactoring without changing functionality
   - `docs/` - For documentation updates

### Working on Features

1. **Commit frequently with clear messages**:
   ```bash
   git add .
   git commit -m "Descriptive message about what changed and why"
   ```

2. **Keep commits focused and logical**:
   - Each commit should represent a single logical change
   - Avoid mixing unrelated changes in a single commit

3. **Push changes to remote**:
   ```bash
   git push origin feature/descriptive-feature-name
   ```

### Testing Changes

1. **Local testing**:
   - Run the application locally
   - Test the specific feature you've implemented
   - Run automated tests if available

2. **Create a test plan**:
   - Document the test cases for your feature
   - Include edge cases and potential failure scenarios
   - Document the expected behavior

3. **Verify against requirements**:
   - Ensure all requirements are met
   - Check for any unintended side effects

### Code Review Process

1. **Create a pull request**:
   - Go to GitHub repository
   - Click "New pull request"
   - Select your feature branch and target branch (usually main)
   - Fill in the PR template with details about your changes

2. **Request reviews**:
   - Assign at least one reviewer to your PR
   - Respond to feedback and make requested changes

3. **Address feedback**:
   ```bash
   # Make changes based on feedback
   git add .
   git commit -m "Address PR feedback: specific changes made"
   git push origin feature/descriptive-feature-name
   ```

### Merging to Main

1. **Ensure all checks pass**:
   - All automated tests pass
   - Code review approved
   - No merge conflicts

2. **Merge options**:
   - **Squash and merge**: Combines all commits into one (preferred for cleaner history)
     ```bash
     # From GitHub UI, select "Squash and merge"
     ```
   - **Merge commit**: Preserves all commits (useful for complex features)
     ```bash
     # From GitHub UI, select "Create a merge commit"
     ```

3. **Delete the branch after merging**:
   ```bash
   # Locally
   git checkout main
   git pull origin main
   git branch -d feature/descriptive-feature-name
   
   # On GitHub
   # Click "Delete branch" after merging
   ```

### Rolling Back Code Changes

#### Option 1: Revert the merge commit

If the changes have been merged to main:

```bash
# Find the merge commit hash
git log

# Revert the merge commit
git revert -m 1 <merge-commit-hash>

# Push the revert commit
git push origin main
```

#### Option 2: Reset to a previous state (use with caution)

Only use this if the changes haven't been pushed to the remote repository:

```bash
# Find the commit hash to return to
git log

# Hard reset to that commit
git reset --hard <commit-hash>
```

#### Option 3: Create a new "revert" branch

```bash
# Create a new branch for the revert
git checkout -b revert/feature-name

# Revert the problematic commit(s)
git revert <commit-hash>

# Push and create a PR for the revert
git push origin revert/feature-name
```

---

## Database Change Control

### Database Migration Process

1. **Create a schema versions table** (if not exists):
   ```sql
   CREATE TABLE IF NOT EXISTS schema_versions (
     id SERIAL PRIMARY KEY,
     version TEXT NOT NULL UNIQUE,
     applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     description TEXT,
     is_active BOOLEAN DEFAULT TRUE,
     rolled_back_at TIMESTAMP WITH TIME ZONE
   );
   ```

2. **Create migration scripts**:
   - Name format: `YYYYMMDD_description.sql`
   - Always include a corresponding rollback script: `YYYYMMDD_rollback_description.sql`
   - Wrap migrations in transactions

3. **Migration script template**:
   ```sql
   -- Migration script
   BEGIN;
   
   -- Record this migration
   INSERT INTO schema_versions (version, description)
   VALUES ('YYYYMMDD_description', 'Brief description of changes');
   
   -- Your schema changes here
   
   COMMIT;
   ```

4. **Rollback script template**:
   ```sql
   -- Rollback script
   BEGIN;
   
   -- Mark migration as rolled back
   UPDATE schema_versions 
   SET is_active = FALSE, rolled_back_at = NOW()
   WHERE version = 'YYYYMMDD_description';
   
   -- Your rollback logic here
   
   COMMIT;
   ```

### Testing Database Changes

1. **Create a backup before testing**:
   ```sql
   -- Create a backup
   SELECT pg_dump_table('public');
   ```

2. **Apply migration to test environment first**:
   - Run the migration script in a test/staging environment
   - Verify that the script executes without errors

3. **Verify data integrity**:
   - Check that existing data is preserved
   - Verify that new data can be created
   - Test queries that depend on the changed schema

4. **Test application with new schema**:
   - Ensure the application works with the new schema
   - Test all features that interact with the changed tables

### Rolling Back Database Changes

1. **Apply the rollback script**:
   ```sql
   -- Run the rollback script
   -- Contents of YYYYMMDD_rollback_description.sql
   ```

2. **Verify rollback success**:
   ```sql
   -- Check schema_versions table
   SELECT * FROM schema_versions 
   WHERE version = 'YYYYMMDD_description';
   
   -- Should show is_active = FALSE and rolled_back_at populated
   ```

3. **Verify application functionality**:
   - Ensure the application works with the rolled-back schema
   - Test all features that interacted with the changed tables

### Emergency Database Restoration

If all else fails:

1. **Restore from backup**:
   ```sql
   -- Run the backup SQL script saved before migration
   ```

2. **Verify restoration**:
   ```sql
   -- Check that critical tables exist and have data
   SELECT COUNT(*) FROM important_table;
   ```

3. **Update schema_versions table**:
   ```sql
   -- Remove the failed migration record or mark as inactive
   DELETE FROM schema_versions 
   WHERE version = 'YYYYMMDD_description';
   ```

---

## Unified Change Process

### Planning Changes

1. **Document requirements**:
   - Clearly define what the change should accomplish
   - Identify all affected components (UI, API, database)
   - Define acceptance criteria

2. **Create a change plan**:
   - Outline code changes needed
   - Outline database changes needed
   - Identify potential risks and mitigation strategies
   - Create a rollback plan

3. **Get approval**:
   - Have the change plan reviewed by relevant stakeholders
   - Ensure everyone understands the scope and impact

### Implementation Checklist

- [ ] Create a feature branch from main
- [ ] Create database migration and rollback scripts
- [ ] Implement code changes
- [ ] Write or update tests
- [ ] Test locally
- [ ] Create a pull request
- [ ] Apply database changes to test environment
- [ ] Test in test environment
- [ ] Address code review feedback
- [ ] Final verification against requirements

### Deployment Checklist

- [ ] Backup production database
- [ ] Merge approved PR to main
- [ ] Apply database migration to production
- [ ] Deploy code changes
- [ ] Verify deployment success
- [ ] Monitor for issues

### Post-Deployment Verification

- [ ] Verify all features work as expected
- [ ] Check for any performance issues
- [ ] Verify logs for any errors
- [ ] Confirm with stakeholders that requirements are met

---

## Example: Adding Pipeline Management Feature

### Code Changes

1. **Create feature branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/pipeline-management
   ```

2. **Implement feature**:
   - Create new components
   - Update existing components
   - Update types and API functions

3. **Test locally**:
   - Apply database migration to local database
   - Test all pipeline management functionality
   - Test integration with existing features

4. **Create PR**:
   - Push changes to GitHub
   - Create PR with detailed description
   - Request reviews

### Database Changes

1. **Create migration script** (`20250501_add_pipelines.sql`):
   ```sql
   BEGIN;
   
   -- Record this migration
   INSERT INTO schema_versions (version, description)
   VALUES ('20250501_add_pipelines', 'Add pipeline management functionality');
   
   -- Create pipelines table
   CREATE TABLE pipelines (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     is_default BOOLEAN DEFAULT FALSE,
     display_order INT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Additional schema changes...
   
   COMMIT;
   ```

2. **Create rollback script** (`20250501_rollback_pipelines.sql`):
   ```sql
   BEGIN;
   
   -- Mark migration as rolled back
   UPDATE schema_versions 
   SET is_active = FALSE, rolled_back_at = NOW()
   WHERE version = '20250501_add_pipelines';
   
   -- Drop tables and undo changes...
   
   COMMIT;
   ```

3. **Apply to test environment and verify**

### Deployment

1. **Backup production database**
2. **Merge PR to main**
3. **Apply database migration to production**
4. **Deploy code changes**
5. **Verify functionality**

### Rollback (if needed)

1. **Apply database rollback script**
2. **Revert the merge commit**:
   ```bash
   git revert -m 1 <merge-commit-hash>
   git push origin main
   ```
3. **Verify application functionality**
