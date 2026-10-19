# Smart Forms, Inputs & Upload UX Rules

## 1. Controlled Input & Validation Integrity
- Every `<input>`, `<select>`, and `<textarea>` inside a React form MUST bind both `value` and `onChange` to state—never leave orphan `defaultValue` inputs that fail to update state on submit.
- Phone numbers, national IDs, emails, and monetary amounts should use `font-mono`.
- When validating required fields or business constraints (e.g., duplicate National ID/phone, insufficient stock, or zero amount), use `showToast(message, 'warning')` from `useFeedback()` instead of `alert()`.

## 2. Searchable Comboboxes & Preset Chips
- When selecting from large entity lists (e.g., Beneficiaries or Donors), provide a searchable combobox using `normalizeArabicKurdish()` matching name, phone, national ID, and governorate.
- For multi-tag fields (like Volunteer `skills` or Expense `category`), provide one-click preset chips alongside a custom text input.

## 3. Drag-and-Drop File & Excel Uploads
- Every file upload dropzone MUST attach `onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}` and `onDrop` handlers in addition to `onClick={() => inputRef.current?.click()}`.
- In bulk import wizards (Excel or multi-document), display row-by-row validation reasons (`err.reason`) and a preview table before final submission.
