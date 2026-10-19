---
name: responsive-ux-audit
description: Audit and optimize high-density tables, pagination, mobile responsiveness, and interactive GeoMap user experience.
---

# Responsive Table & Mobile UX Audit Runbook

Follow this checklist when auditing or adding tables, toolbars, or map interfaces:

1. **Pagination & Filter Sync**:
   - Confirm `paginatedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize)`.
   - Confirm `<PaginationBar currentPage={safePage} totalItems={filteredItems.length} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={...} />` is rendered at the bottom of the table container.

2. **Mobile Breakpoint Check**:
   - Verify multi-column grids collapse cleanly (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
   - Verify filter pill rows use `whitespace-nowrap` and `overflow-x-auto` so Kurdish labels never wrap awkwardly on narrow screens.

3. **Input Focus Continuity**:
   - Verify that typing into any search input (`searchQuery`, `houseSearchQuery`) does not cause the input element to unmount/remount on keystroke.
