// Show/disable conditions and field validation rules, as edited in the properties panel.
// Both are stored as JSON arrays (or JSON strings of them) on a component's props.

export function parseRuleList(input) {
  if (Array.isArray(input)) return input;
  if (typeof input !== 'string' || !input.trim()) return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const isEmpty = (value) =>
  value === undefined || value === null || value === false ||
  (Array.isArray(value) ? value.length === 0 : typeof value === 'object' ? Object.keys(value).length === 0 : String(value).trim() === '');

const text = (value) => (value === undefined || value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value));
const listOf = (value) => (Array.isArray(value) ? value : String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean));
const bothNumbers = (a, b) => text(a).trim() !== '' && text(b).trim() !== '' && Number.isFinite(Number(a)) && Number.isFinite(Number(b));

export function testCondition(condition, values) {
  const actual = values[condition.field];
  const expected = condition.value;
  switch (condition.operator) {
    case 'equals': return bothNumbers(actual, expected) ? Number(actual) === Number(expected) : text(actual) === text(expected);
    case 'not_equals': return bothNumbers(actual, expected) ? Number(actual) !== Number(expected) : text(actual) !== text(expected);
    case 'contains': return Array.isArray(actual) ? actual.map(text).includes(text(expected)) : text(actual).includes(text(expected));
    case 'not_contains': return Array.isArray(actual) ? !actual.map(text).includes(text(expected)) : !text(actual).includes(text(expected));
    case 'starts_with': return text(actual).startsWith(text(expected));
    case 'ends_with': return text(actual).endsWith(text(expected));
    case 'greater_than': return bothNumbers(actual, expected) && Number(actual) > Number(expected);
    case 'less_than': return bothNumbers(actual, expected) && Number(actual) < Number(expected);
    case 'greater_equal': return bothNumbers(actual, expected) && Number(actual) >= Number(expected);
    case 'less_equal': return bothNumbers(actual, expected) && Number(actual) <= Number(expected);
    case 'in': return listOf(expected).includes(text(actual));
    case 'not_in': return !listOf(expected).includes(text(actual));
    case 'empty': return isEmpty(actual);
    case 'not_empty': return !isEmpty(actual);
    case 'array_contains': return Array.isArray(actual) && listOf(expected).some((item) => actual.map(text).includes(item));
    case 'array_length_equals': return Array.isArray(actual) && actual.length === Number(expected);
    case 'array_length_greater': return Array.isArray(actual) && actual.length > Number(expected);
    case 'array_length_less': return Array.isArray(actual) && actual.length < Number(expected);
    default: return false;
  }
}

// Conditions read left to right; AND binds tighter than OR, as in most rule builders.
// Conditions without a field are ignored so a half-filled row does not hide a component.
export function evaluateConditions(input, values = {}) {
  const conditions = parseRuleList(input).filter((condition) => condition && condition.field);
  if (!conditions.length) return null;
  const groups = [[]];
  conditions.forEach((condition, index) => {
    if (index > 0 && condition.logicalOperator === 'OR') groups.push([]);
    groups[groups.length - 1].push(condition);
  });
  return groups.some((group) => group.every((condition) => testCondition(condition, values)));
}

const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  number: /^-?\d+(\.\d+)?$/,
  integer: /^-?\d+$/,
};

// Returns the first failing rule's message, or null when the value passes.
export function validateValue(input, value) {
  const empty = isEmpty(value);
  for (const rule of parseRuleList(input)) {
    const limit = Number(rule.value);
    const length = text(value).length;
    let failed = false;
    let fallback = 'Invalid value';
    switch (rule.type) {
      case 'required': failed = empty; fallback = 'This field is required'; break;
      case 'minLength': failed = !empty && Number.isFinite(limit) && length < limit; fallback = `Minimum length is ${rule.value}`; break;
      case 'maxLength': failed = !empty && Number.isFinite(limit) && length > limit; fallback = `Maximum length is ${rule.value}`; break;
      case 'min': failed = !empty && Number.isFinite(limit) && !(Number(value) >= limit); fallback = `Minimum value is ${rule.value}`; break;
      case 'max': failed = !empty && Number.isFinite(limit) && !(Number(value) <= limit); fallback = `Maximum value is ${rule.value}`; break;
      case 'email': case 'url': case 'number': case 'integer':
        failed = !empty && !PATTERNS[rule.type].test(text(value).trim()); fallback = `Enter a valid ${rule.type}`; break;
      case 'pattern': case 'custom':
        // A custom rule is a regular expression; the JSON never carries executable code.
        try { failed = !empty && Boolean(rule.value) && !new RegExp(rule.value).test(text(value)); } catch { failed = false; }
        fallback = 'Invalid format'; break;
      default: break;
    }
    if (failed) return rule.message || fallback;
  }
  return null;
}
