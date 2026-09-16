/**
 * Q2 Form Validator: Schema-based validator for the Registration Suite
 */

import { ValidationRules } from '../../utils/validators.js';

export class RegistrationFormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.errors = new Map();
  }

  validateField(fieldName, value, allValues = {}) {
    let result = { isValid: true, message: '' };

    switch (fieldName) {
      case 'name':
        result = ValidationRules.validateName(value);
        break;
      case 'email':
        result = ValidationRules.validateEmail(value);
        break;
      case 'phone':
        result = ValidationRules.validatePhone(value);
        break;
      case 'password':
        result = ValidationRules.evaluatePassword(value);
        break;
      case 'confirmPassword':
        result = ValidationRules.validatePasswordMatch(allValues.password, value);
        break;
    }

    if (!result.isValid) {
      this.errors.set(fieldName, result.message);
    } else {
      this.errors.delete(fieldName);
    }

    return result;
  }

  validateAll(formData) {
    this.errors.clear();
    const results = {};

    results.name = this.validateField('name', formData.name);
    results.email = this.validateField('email', formData.email);
    results.phone = this.validateField('phone', formData.phone);
    results.password = this.validateField('password', formData.password);
    results.confirmPassword = this.validateField('confirmPassword', formData.confirmPassword, formData);

    const isValid = Array.from(this.errors.values()).length === 0;
    return { isValid, errors: Object.fromEntries(this.errors), results };
  }
}
