---
name: form-ux-upgrade
description: Audit and enhance data entry forms, searchable comboboxes, preset tag selectors, and drag-and-drop upload wizards.
---

# Smart Form & Import Wizard UX Runbook

Follow this checklist when building or reviewing forms in the application:

1. **Controlled State Binding Check**:
   - Inspect every input in the form to ensure `value={formData.field}` and `onChange` update the exact state property read inside `handleSubmit`.
   - For dynamic category forms (like the 8 in-kind categories in `DonorsView.tsx`), verify quantity, unit, and unit-price inputs auto-calculate total value when applicable.

2. **Duplicate & Error Feedback**:
   - Check `checkDuplicate(nationalId, phone)` in real time or on submit and present a clear Kurdish warning toast or inline alert card linking to the existing dossier.

3. **Drag-and-Drop Verification**:
   - Ensure upload zones extract `e.dataTransfer.files` on drop and funnel them into the same file processor function used by `<input type="file" onChange={...} />`.
