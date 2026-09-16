/**
 * Form & Input Validation Engine
 * Validates fields with strict regex, format rules, and detailed error messages.
 */

// RFC 5322 standard compliant email regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Standard 10-15 digit phone regex allowing international prefixes +, (), -, space
const PHONE_REGEX = /^\+?[0-9\s\-()]{10,20}$/;

// Name regex (letters, spaces, hyphens, apostrophes - min 2 chars)
const NAME_REGEX = /^[a-zA-Z\s\-']{2,50}$/;

export const ValidationRules = {
  /**
   * Validates Full Name
   */
  validateName(name) {
    if (!name || !name.trim()) {
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
    if (!email || !email.trim()) {
      return { isValid: false, message: 'Email address is required.' };
    }
    const clean = email.trim();
    if (!EMAIL_REGEX.test(clean)) {
      return { isValid: false, message: 'Please enter a valid email address (e.g. user@domain.com).' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validates Phone Number
   */
  validatePhone(phone) {
    if (!phone || !phone.trim()) {
      return { isValid: false, message: 'Phone number is required.' };
    }
    const clean = phone.trim();
    // Count raw digits
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return { isValid: false, message: 'Phone number must contain at least 10 digits.' };
    }
    if (digitsOnly.length > 15) {
      return { isValid: false, message: 'Phone number cannot exceed 15 digits.' };
    }
    if (!PHONE_REGEX.test(clean)) {
      return { isValid: false, message: 'Invalid phone number format.' };
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
        label: 'Empty',
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

    if (score >= 5) {
      label = 'Very Strong';
      isValid = true;
    } else if (score >= 4) {
      label = 'Strong';
      isValid = true;
    } else if (score >= 3) {
      label = 'Medium';
      isValid = false; // assessment requires all core constraints
    } else if (score >= 2) {
      label = 'Weak';
      isValid = false;
    }

    let message = '';
    if (!requirements.minLength) message = 'Password must be at least 8 characters.';
    else if (!requirements.hasUppercase) message = 'Must contain at least 1 uppercase letter.';
    else if (!requirements.hasLowercase) message = 'Must contain at least 1 lowercase letter.';
    else if (!requirements.hasNumber) message = 'Must contain at least 1 number.';
    else if (!requirements.hasSpecial) message = 'Must contain at least 1 special character (@$!%*?&#).';

    return { isValid, score, label, message, requirements };
  },

  /**
   * Validates Confirm Password
   */
  validatePasswordMatch(password, confirmPassword) {
    if (!confirmPassword) {
      return { isValid: false, message: 'Please confirm your password.' };
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
