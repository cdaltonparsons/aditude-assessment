// Display-only formatting for the SCREAMING_SNAKE_CASE role/permission
// values. The raw value is still what's sent to and stored by the API —
// this never touches that, it only changes what's rendered.
export function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
