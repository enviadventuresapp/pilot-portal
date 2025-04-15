
/**
 * Ensures a value is a number or converts it to a number.
 * If conversion fails, returns the default value.
 * 
 * @param value The value to ensure is a number
 * @param defaultValue The default value to return if conversion fails
 * @returns A number
 */
export function ensureNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  return defaultValue;
}

/**
 * Safely formats a number with a fixed number of decimals.
 * If the input isn't a number, converts it first.
 * 
 * @param value The value to format
 * @param decimals The number of decimal places
 * @param defaultValue The default value to use if conversion fails
 * @returns Formatted number string
 */
export function safeToFixed(value: any, decimals: number = 1, defaultValue: number = 0): string {
  const number = ensureNumber(value, defaultValue);
  return number.toFixed(decimals);
}

/**
 * Safely adds two values, ensuring they are numbers first.
 * 
 * @param a First value
 * @param b Second value
 * @returns The sum as a number
 */
export function safeAdd(a: any, b: any): number {
  return ensureNumber(a) + ensureNumber(b);
}

/**
 * Safely subtracts two values, ensuring they are numbers first.
 * 
 * @param a First value
 * @param b Second value
 * @returns The difference as a number
 */
export function safeSubtract(a: any, b: any): number {
  return ensureNumber(a) - ensureNumber(b);
}

/**
 * Safely calculates the difference between two tach values,
 * accounting for potential string inputs.
 * 
 * @param end The ending tach value
 * @param start The starting tach value
 * @returns The tach time difference as a number
 */
export function calculateTachDiff(end: any, start: any): number {
  return safeSubtract(end, start);
}

/**
 * Safely parses a string to a number for database operations
 * and ensures it's a string when needed for Supabase operations
 * 
 * @param value The numeric value
 * @returns The value as a string for DB operations
 */
export function numberToDbString(value: number | string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  
  const num = ensureNumber(value);
  return num.toString();
}

/**
 * Safely compares two numbers, handling possible type conversions
 * 
 * @param a First number
 * @param b Second number
 * @returns Comparison result: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function safeCompareNumbers(a: any, b: any): number {
  const numA = ensureNumber(a);
  const numB = ensureNumber(b);
  
  if (numA < numB) return -1;
  if (numA > numB) return 1;
  return 0;
}
