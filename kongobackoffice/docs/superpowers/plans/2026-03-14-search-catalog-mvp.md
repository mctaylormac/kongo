# Search Catalog MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Search page display all trips by default, reuse Home filters, improve UI contrast/size, and generate a real QR code for ticket reference while keeping MVP (no payment integration).

**Architecture:** Reuse existing SearchResults as the catalog view by default. Reuse filter UI patterns from AgencyDirectory for new filters on SearchResults. Replace pseudo-QR with a real QR generator. Adjust CTA/badge styles in targeted components to match the provided visual references.

**Tech Stack:** React 18, Vite, Tailwind CSS, Supabase JS, motion, lucide-react.

---

## Chunk 1: Behavior + Navigation

### Task 1: Make SearchResults show all trips by default

**Files:**
- Modify: `src/components/SearchResults.tsx`
- Test: `src/components/__tests__/SearchResults.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/SearchResults.test.tsx
import { render, screen } from "@testing-library/react";
import { SearchResults } from "../SearchResults";

test("renders catalog header when searchParams is null", () => {
  render(<SearchResults searchParams={null} onSelectTrip={() => {}} />);
  expect(screen.getByText(/Tous les voyages/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand` (or `npx vitest run`)  
Expected: FAIL (test runner missing or header not found)

- [ ] **Step 3: Write minimal implementation**

```tsx
// SearchResults.tsx (header logic)
const isCatalogMode = !searchParams;
...
<h1 className="text-3xl font-bold text-kongo-black mb-2">
  {isCatalogMode ? "Tous les voyages" : `${currentSearchParams.from} → ${currentSearchParams.to}`}
</h1>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults.tsx src/components/__tests__/SearchResults.test.tsx
git commit -m "feat: show catalog header when no search params"
```

### Task 2: Ensure data load when no searchParams

**Files:**
- Modify: `src/components/SearchResults.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
test("does not render empty-state when searchParams is null", () => {
  render(<SearchResults searchParams={null} onSelectTrip={() => {}} />);
  expect(screen.queryByText(/Commencez votre recherche/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL (empty state still shown)

- [ ] **Step 3: Write minimal implementation**

```tsx
// Remove or gate the empty state
if (!searchParams) {
  // return catalog intro instead of "start search" screen
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults.tsx src/components/__tests__/SearchResults.test.tsx
git commit -m "feat: show catalog instead of empty state"
```

### Task 3: Wire "Voir Toutes les Destinations" to Search page

**Files:**
- Modify: `src/components/DestinationsCarousel.tsx`
- Modify: `src/App.tsx` (event listener)

- [ ] **Step 1: Write the failing test**

```tsx
// pseudo test - verify click dispatches navigation event
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL (no handler)

- [ ] **Step 3: Write minimal implementation**

```tsx
// DestinationsCarousel.tsx
<Button onClick={() => window.dispatchEvent(new CustomEvent("navigate-to-search"))}>
  Voir Toutes les Destinations
</Button>
```

```tsx
// App.tsx (inside effects)
const handleNavigateToSearch = () => appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
window.addEventListener("navigate-to-search", handleNavigateToSearch);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DestinationsCarousel.tsx src/App.tsx
git commit -m "feat: route destinations CTA to search"
```

## Chunk 2: Filters From Home (AgencyDirectory) Adapted to Search

### Task 4: Add filter UI inspired by AgencyDirectory

**Files:**
- Modify: `src/components/SearchResults.tsx`
- Reference: `src/components/AgencyDirectory.tsx` (UI pattern only)

- [ ] **Step 1: Write the failing test**

```tsx
test("renders region and service level filters", () => {
  render(<SearchResults searchParams={null} onSelectTrip={() => {}} />);
  expect(screen.getByText(/Région/i)).toBeInTheDocument();
  expect(screen.getByText(/Niveau de Service/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL (filters not rendered)

- [ ] **Step 3: Write minimal implementation**

```tsx
// Add new filter controls near existing filters in SearchResults
// - region (Select)
// - service level (Select)
// - premium only (Checkbox)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults.tsx src/components/__tests__/SearchResults.test.tsx
git commit -m "feat: add home-style filters to search"
```

### Task 5: Map new filters to trips data

**Files:**
- Modify: `src/components/SearchResults.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
test("filters trips by selected service level", () => {
  // Render with a small dataset mocked in component (or mock supabase)
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
// Apply filter mapping in the filter effect:
// - region: match origin/destination name or agency region if available
// - service level: map to vehicleType/busType or amenities tags
// - premium: boolean or price threshold (define clearly)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults.tsx src/components/__tests__/SearchResults.test.tsx
git commit -m "feat: apply home filters to trips list"
```

## Chunk 3: QR Code Ticket (Real QR)

### Task 6: Replace pseudo QR with real QR code

**Files:**
- Modify: `src/components/TripConfirmation.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write the failing test**

```tsx
test("renders QR code with ticket reference", () => {
  // Expect rendered QR element to contain TICKET-<ref>
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
// Use a QR lib (e.g. qrcode.react) and set value to `TICKET-${bookingReference}`
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TripConfirmation.tsx package.json
git commit -m "feat: render real QR with ticket reference"
```

## Chunk 4: UI Contrast / Size / Colors (Targeted)

### Task 7: Adjust CTA and badge contrast for target sections

**Files:**
- Modify: `src/components/DestinationsCarousel.tsx`
- Modify: `src/components/AgencyDirectory.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing test**

```tsx
test("primary CTA buttons use improved contrast classes", () => {
  render(<DestinationsCarousel favoriteRoutes={[]} />);
  expect(screen.getByText(/Voir Toutes les Destinations/i)).toHaveClass("btn-primary-contrast");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```css
/* index.css */
.btn-primary-contrast { /* stronger lime, higher text contrast */ }
.badge-contrast { /* thicker border + higher contrast text */ }
```

```tsx
// Apply new classes to CTA buttons and badges
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DestinationsCarousel.tsx src/components/AgencyDirectory.tsx src/index.css
git commit -m "feat: improve CTA and badge contrast"
```

## Chunk 5: Encoding Cleanup (Accents)

### Task 8: Fix mojibake strings in touched components

**Files:**
- Modify: `src/components/SearchResults.tsx`
- Modify: `src/components/DestinationsCarousel.tsx`
- Modify: `src/components/TripConfirmation.tsx`
- Modify: `src/App.tsx` (if touched)

- [ ] **Step 1: Write the failing test**

```tsx
test("renders French strings with proper accents", () => {
  render(<SearchResults searchParams={null} onSelectTrip={() => {}} />);
  expect(screen.getByText(/Équipements/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run`  
Expected: FAIL (mojibake)

- [ ] **Step 3: Write minimal implementation**

```tsx
// Replace corrupted strings with proper UTF-8 text
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchResults.tsx src/components/DestinationsCarousel.tsx src/components/TripConfirmation.tsx
git commit -m "chore: fix French accent encoding"
```

---

## Notes

- If test runner is missing, add `vitest` + `@testing-library/react` in a preliminary task, or mark tests as manual for MVP (decide before implementation).
- No backend payment integration in this MVP.
- "Demander un trajet personnalisé" remains visible but disabled with a "Bientôt" tooltip.

