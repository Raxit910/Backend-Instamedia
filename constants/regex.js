export const REGEX = {
  USERNAME: /^[a-zA-Z0-9]+$/, // only alphanumeric characters
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // standard email format
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, // at least 8 chars, mixed case, number, symbol
};
