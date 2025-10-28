# Testing Design Snapshot Fix

## Problem Check
The logs show customization_option_id: 376 with "helood" text.
If this is appearing in multiple orders, we need to verify:
1. Is 376 actually a snapshot?
2. Are NEW cart items creating NEW snapshots?

## Proper Test Procedure

### Step 1: Clear Everything
1. Go to your cart and REMOVE all existing items
2. This ensures we're testing with fresh cart items using the new snapshot system

### Step 2: Create First Design
1. Go to product design page
2. Create a design with text "FIRST ORDER"
3. Go to quantity page
4. Add to cart
5. **LOOK FOR THIS LOG**: `✅ Snapshot created: [source_id] → [new_snapshot_id]`
6. Note the snapshot ID that was created

### Step 3: Create Second Design  
1. Go back to the SAME product design page
2. Modify the design to say "SECOND ORDER" instead
3. Go to quantity page
4. Add to cart
5. **LOOK FOR THIS LOG**: `✅ Snapshot created: [source_id] → [different_snapshot_id]`
6. Note this new snapshot ID should be DIFFERENT from Step 2

### Step 4: Place Orders
1. Place first order (with "FIRST ORDER" design)
2. Place second order (with "SECOND ORDER" design)

### Step 5: Verify in Admin
1. Open first order in admin panel
2. Download ZIP - should contain "FIRST ORDER" text
3. Open second order in admin panel  
4. Download ZIP - should contain "SECOND ORDER" text

## Expected Backend Logs

When adding to cart, you should see:
```
🔒 Creating snapshot of customization [live_id]...
✅ Created snapshot [new_snapshot_id] from source [live_id]
✅ Snapshot created: [live_id] → [new_snapshot_id]
```

## Database Verification

Check if snapshots exist:
```sql
SELECT id, 
       design_metadata->>'$.is_snapshot' as is_snapshot,
       design_metadata->>'$.source_customization_id' as source_id,
       JSON_EXTRACT(canvas_data, '$.objects[0].text') as first_text
FROM customization_options 
WHERE user_id = 66 
ORDER BY id DESC LIMIT 10;
```

Should show multiple snapshot records with is_snapshot=true
