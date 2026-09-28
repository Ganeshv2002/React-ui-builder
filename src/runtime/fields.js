import { createContext } from 'react';

// Page-wide field values keyed by field name, so show/disable conditions and validation
// work for any input on the page, inside a form or not. Null outside the runtime (the canvas).
export const FieldsContext = createContext(null);
