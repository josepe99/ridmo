# Next.js 15 Dynamic Route Params Fix

## Issue
Next.js 15 introduced a breaking change where `params` in dynamic routes must be awaited before accessing properties.

## Error Message
```
Error: Route "/admin/collections/[collectionId]" used `params.collectionId`. `params` should be awaited before using its properties.
```

## Fixed Files

### 1. `/app/admin/collections/[collectionId]/page.tsx`
**Before:**
```tsx
export default async function AdminCollectionPage({ params }: PageProps) {
  await requireAdmin()
  
  const collection = await prisma.collection.findUnique({
    where: { id: params.collectionId }, // ❌ Direct access
```

**After:**
```tsx
export default async function AdminCollectionPage({ params }: PageProps) {
  await requireAdmin()

  // Await params before accessing properties (Next.js 15 requirement)
  const { collectionId } = await params // ✅ Awaited destructuring

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId }, // ✅ Using destructured value
```

### 2. `/app/[collectionSlug]/[productSlug]/page.tsx`
**Before:**
```tsx
export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find((p) => p.collectionSlug === params.collectionSlug && p.slug === params.productSlug)
```

**After:**
```tsx
export default async function ProductPage({ params }: ProductPageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { collectionSlug, productSlug } = await params
  
  const product = products.find((p) => p.collectionSlug === collectionSlug && p.slug === productSlug)
```

### 3. `/app/coleccion/[collectionSlug]/page.tsx`
**Before:**
```tsx
export default function CollectionPage({ params }: CollectionPageProps) {
  const collection = collections.find((c) => c.slug === params.collectionSlug)
```

**After:**
```tsx
export default async function CollectionPage({ params }: CollectionPageProps) {
  // Await params before accessing properties (Next.js 15 requirement)
  const { collectionSlug } = await params
  
  const collection = collections.find((c) => c.slug === collectionSlug)
```

## Key Changes

1. **All component functions are now `async`** - Required to use `await params`
2. **Destructuring after awaiting** - `const { paramName } = await params`
3. **Consistent pattern** - Applied across all dynamic route pages

## Notes

- API routes (`/api/*/[id]/route.ts`) don't need this fix because they don't use `params` directly
- The controllers extract route parameters from the URL path manually
- This is a Next.js 15 requirement for better performance and consistency

## Migration Pattern

```tsx
// Old Pattern (Next.js 14 and below)
export default function Page({ params }: { params: { slug: string } }) {
  const data = getData(params.slug) // ❌ Direct access
}

// New Pattern (Next.js 15+)
export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = await params // ✅ Await first
  const data = getData(slug)
}
```
