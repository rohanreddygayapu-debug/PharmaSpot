# Doctor Index Fix

## Problem
The E11000 duplicate key error occurs when multiple doctors try to register without providing a `physID` value. This happens because MongoDB's unique index on the `physID` field doesn't allow multiple `null` values unless the index is created as `sparse`.

## Solution
The Doctor model schema already defines `physID` with `sparse: true`, but if the database was created before this setting was added, or if the index was manually created without the sparse option, the index needs to be rebuilt.

## How to Fix

### Option 1: Run the Fix Script (Recommended for existing databases)
If you're experiencing the E11000 error, run this script to rebuild the index:

```bash
cd backend
npm run fix-doctor-index
```

This script will:
1. Connect to the MongoDB database
2. Drop the existing `physID_1` index if it exists
3. Create a new sparse unique index for `physID`

### Option 2: Automatic Fix on Server Start
The server now automatically initializes all model indexes on startup (including the sparse physID index). This ensures that new deployments won't have this issue.

## What Changed
1. **backend/models/Doctor.js** - The model already had `sparse: true` for the physID field
2. **backend/config/initIndexes.js** - New file that ensures indexes are properly initialized on server start
3. **backend/server.js** - Updated to call `initIndexes()` when connected to MongoDB
4. **backend/scripts/fixDoctorIndex.js** - Script to manually fix the index for existing databases
5. **backend/package.json** - Added `fix-doctor-index` script for easy execution

## Technical Details
- A sparse index only includes documents that contain the indexed field
- This allows multiple documents to have `null` or missing values for a uniquely indexed field
- Without `sparse: true`, only one document can have a `null` value for a unique field
