# Bug Analysis: Repeat Orders Getting Wrong Elements in ZIP Download

## Problem Description
When a user orders the same product for the 2nd time:
- ✅ Preview images are correct
- ❌ Other elements in ZIP (texts, images, transformed images) only show first (front view) elements
- ✅ First order works fine for all products

## Root Cause

### The Issue
The frontend's `designStore` caches `client_reference_id` using the key `"productId_variationId"`. When a user designs the same product+variation multiple times:

1. **First Order (Works Fine):**
   - User designs Product 1, Variation 1 (front + back views)
   - Creates CustomizationOptions: id=1 (front), id=2 (back)
   - Both share `client_reference_id = "design_1_1_TIME1"`
   - Cart stores `customization_option_id = 1` (front view)
   - Order placed successfully
   - ZIP download fetches ALL options with `client_reference_id`, gets both front and back ✅

2. **Second Order (BUG):**
   - User designs Product 1, Variation 1 again
   - `findExistingDesign()` in `designApi.ts` finds the OLD CustomizationOptions (id=1, id=2)
   - Frontend reuses the SAME `client_reference_id` from cache
   - When saving new designs, it **UPDATES** the existing CustomizationOptions
   - If user only designs front view → Only id=1 gets updated with new data
   - id=2 (back) still has OLD data from first order
   - ZIP download fetches ALL options with that `client_reference_id`
   - Gets mixed data: NEW front (id=1) + OLD back (id=2) ❌

### Why Preview Images Are Correct
Preview images come from `order_item.customized_images`, which is populated during checkout from the cart's `customized_images` field. This is fetched fresh during checkout, so it's always up-to-date.

## Code Locations

### Frontend Issues
1. **designStore.ts:103-110** - `clientReferenceIds` cache uses `"productId_variationId"` key
   - This cache persists across sessions and orders
   - No cleanup after cart operations

2. **designStore.ts:298-306** - Reuses cached `client_reference_id`
   ```typescript
   const sharedKey = generateSharedClientReferenceKey(state.productId, variationId.toString());
   let existingClientReferenceId = state.clientReferenceIds.get(sharedKey);
   if (!existingClientReferenceId) {
     existingClientReferenceId = generateSharedClientReferenceId(state.productId, variationId.toString());
   }
   ```

3. **designApi.ts:276-295** - `findExistingDesign()` finds old CustomizationOptions
   - Queries backend for existing designs by user+product+variation+area
   - Causes UPDATEs instead of INSERTs for new orders

### Backend Issues
4. **orders/router.py:480-487** - ZIP download fetches ALL options with same `client_reference_id`
   ```python
   result = await db.execute(
       select(product_models.CustomizationOption)
       .where(product_models.CustomizationOption.client_reference_id == main_option.client_reference_id)
   )
   all_options = result.scalars().all()
   ```
   - No filtering by order or timestamp
   - Gets options from ALL orders with that `client_reference_id`

## Solution

### Option 1: Clear Cache After Add to Cart (RECOMMENDED)
Add a method to clear the `clientReferenceIds` cache when adding items to cart. This forces new orders to create fresh CustomizationOptions.

**Pros:**
- Simple, minimal changes
- Doesn't break existing data
- Clean separation between orders

**Cons:**
- Requires updating multiple components

### Option 2: Generate Truly Unique client_reference_id
Change `generateSharedClientReferenceId` to include more uniqueness (e.g., random UUID).

**Pros:**
- Guaranteed uniqueness

**Cons:**
- Breaks the "shared" concept across design areas
- Requires backend changes too

### Option 3: Make CustomizationOptions Immutable
Once a CustomizationOption is linked to an order, prevent updates.

**Pros:**
- Clean data model
- Historical tracking

**Cons:**
- Complex database changes
- Need migration strategy

## Recommended Fix: Option 1

Implement the following changes:
1. Add `clearClientReferenceCache()` method to `designStore`
2. Call it after adding to cart
3. Optionally: Call it when navigating to design page for fresh start
