export const MESSAGES = {
  AUTH: {
    EMAIL_OR_USERNAME_EXISTS: 'Email or username already exists.',
    REGISTER_SUCCESS: 'Registration successful! Check your email to activate your account.',
    INVALID_CREDENTIALS: 'Invalid credentials or inactive account.',
    LOGIN_SUCCESS: 'Login successful.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
  },
  INPUT: {
    INPUT_FIELDS_ARE_REQUIRED_REGISTER: 'Username, email, and password are required.',
    INVALID_USERNAME_FORMAT: 'Username must be alphanumeric without spaces or symbols.',
    USERNAME_ALREADY_TAKEN: 'This username is already taken.',
    INVALID_EMAIL_FORMAT: 'Invalid email format.',
    EMAIL_ALREADY_TAKEN: 'This email is already registered.',
    USERNAME_AND_EMAIL_TAKEN: 'Both username and email are already taken.',
    INPUT_FIELDS_ARE_REQUIRED_LOGIN: 'Email or username and password are required.',
    INVALID_PASSWORD_FORMAT:
      'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
  },
  ACTIVATION: {
    ACCOUNT_SUCCESSFULLY_ACTIVATED: 'Account activated successfully. You can now log in.',
    ACCOUNT_INACTIVE: 'Account is not activated.',
    ACCOUNT_ALREADY_ACTIVATED: 'Account is already activated.',
    MISSING_ACTIVATION_TOKEN: 'Activation token is missing.',
    INVALID_OR_EXPIRED_ACTIVATION_TOKEN: 'Invalid or expired activation token.',
    USER_NOT_FOUND: 'User not found.',
  },
  FORGOT_PASSWORD: {
    EMAIL_REQUIRED: 'Email is required.',
    LINK_ALREADY_SENT: 'If that email exists, a reset link was sent.',
    RESET_LINK_SENT: 'Password reset link sent to your email.',
    PASSWORD_UPDATE_SUCCESS: 'Password updated successfully.',
  },
  TOKEN: {
    TOKEN_AND_NEW_PASSWORD_REQUIRED: 'Token and new password are required.',
    INVALID_OR_EXPIRED_RESET_TOKEN: 'Invalid or expired reset token.',
    NO_TOKEN_PROVIDED: 'Unauthorized: No token provided',
    INVALID_OR_EXPIRED_TOKEN: 'Unauthorized: Invalid or expired token',
    MISSING_REFRESH_TOKEN: 'Missing refresh token',
    TOKEN_REFRESHED_SUCCESS: 'Access token refreshed successfully',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  },
  COMMON: {
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    UNAUTHORIZED: 'Unauthorized access.',
    NOT_FOUND: 'Resource not found.',
  },
};
