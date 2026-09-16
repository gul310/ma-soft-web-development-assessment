/**
 * Form & Input Validation Engine
 * Validates fields with strict rules, Pakistani phone format support, and detailed error messages.
 */

// Browser-compatible robust email regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Standard name regex (allows letters, spaces, hyphens, apostrophes, and accented characters - 2 to 50 chars)
const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F\s\-']{2,50}$/;

export const ValidationRules = {
  /**
   * Validates Full Name
   */
  validateName(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return { isValid: false, message: 'Full name is required.' };
    }
    const clean = name.trim();
    if (clean.length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters.' };
    }
    if (clean.length > 50) {
      return { isValid: false, message: 'Name cannot exceed 50 characters.' };
    }
    if (!NAME_REGEX.test(clean)) {
      return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes.' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validates Email Address
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string' || !email.trim()) {
      return { isValid: false, message: 'Email address is required.' };
    }
    const clean = email.trim();
    if (!EMAIL_REGEX.test(clean) || clean.indexOf('@') === -1 || clean.lastIndexOf('.') < clean.indexOf('@')) {
      return { isValid: false, message: 'Please enter a valid email address (e.g. user@domain.com).' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validates Phone Number (with explicit Pakistani Phone Support)
   * Supports:
   * - Local: 03XXXXXXXXX (11 digits starting with 03)
   * - International: +923XXXXXXXXX, 00923XXXXXXXXX, 923XXXXXXXXX
   * - With spaces/hyphens: 0300 1234567, 0312-3456789, +92-300-1234567
   */
  validatePhone(phone) {
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return { isValid: false, message: 'Phone number is required.' };
    }
    const clean = phone.trim();

    // Check for alphabetic or invalid characters
    if (/[a-zA-Z]/.test(clean)) {
      return { isValid: false, message: 'Phone number cannot contain letters.' };
    }

    // Extract raw digits
    const digitsOnly = clean.replace(/\D/g, '');

    if (digitsOnly.length < 10) {
      return { isValid: false, message: 'Phone number is too short (minimum 10 digits).' };
    }

    if (digitsOnly.length > 15) {
      return { isValid: false, message: 'Phone number is too long (maximum 15 digits).' };
    }

    // Check Pakistani number patterns
    // 1) Starts with 03 (11 digits, e.g. 03001234567)
    const isLocalPakistani = /^03[0-9]{9}$/.test(digitsOnly);
    
    // 2) Starts with 923 (12 digits, e.g. 923001234567)
    const isIntlPakistani = /^923[0-9]{9}$/.test(digitsOnly);
    
    // 3) Starts with 00923 (14 digits)
    const isDoubleZeroPakistani = /^00923[0-9]{9}$/.test(digitsOnly);

    // 4) Standard international 10-15 digit phone
    const isGeneralValid = digitsOnly.length >= 10 && digitsOnly.length <= 15;

    if (!isLocalPakistani && !isIntlPakistani && !isDoubleZeroPakistani && !isGeneralValid) {
      return { isValid: false, message: 'Please enter a valid phone number (e.g. 03001234567 or +923001234567).' };
    }

    return { isValid: true, message: '' };
  },

  /**
   * Evaluates Password Strength & Policy
   */
  evaluatePassword(password) {
    if (!password) {
      return {
        isValid: false,
        score: 0,
        label: 'Required',
        message: 'Password is required.',
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumber: false,
          hasSpecial: false
        }
      };
    }

    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[@$!%*?&#^()_\-+=\[\]{}|~`]/.test(password)
    };

    let score = 0;
    if (requirements.minLength) score += 1;
    if (requirements.hasUppercase) score += 1;
    if (requirements.hasLowercase) score += 1;
    if (requirements.hasNumber) score += 1;
    if (requirements.hasSpecial) score += 1;

    let label = 'Very Weak';
    let isValid = false;

    if (score === 5) {
      label = 'Very Strong';
      isValid = true;
    } else if (score === 4) {
      label = 'Strong';
      isValid = false; // assessment requires all 5 criteria
    } else if (score === 3) {
      label = 'Medium';
      isValid = false;
    } else if (score === 2) {
      label = 'Weak';
      isValid = false;
    }

    let message = '';
    if (!requirements.minLength) message = 'Password must be at least 8 characters.';
    else if (!requirements.hasUppercase) message = 'Must contain at least 1 uppercase letter (A-Z).';
    else if (!requirements.hasLowercase) message = 'Must contain at least 1 lowercase letter (a-z).';
    else if (!requirements.hasNumber) message = 'Must contain at least 1 numeric digit (0-9).';
    else if (!requirements.hasSpecial) message = 'Must contain at least 1 special character (@$!%*?&#).';

    return { isValid, score, label, message, requirements };
  },

  /**
   * Validates Confirm Password
   */
  validatePasswordMatch(password, confirmPassword) {
    if (!confirmPassword) {
      return { isValid: false, message: 'Confirm password is required.' };
    }
    if (password !== confirmPassword) {
      return { isValid: false, message: 'Passwords do not match.' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validates Student GPA
   */
  validateGPA(gpa) {
    const num = parseFloat(gpa);
    if (isNaN(num) || num < 0 || num > 4.0) {
      return { isValid: false, message: 'GPA must be a valid number between 0.00 and 4.00.' };
    }
    return { isValid: true, message: '' };
  }
};
