import { ValidationError } from './errors.js'

export const requireField = (value, message) => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(message)
  }
}

export const requirePositiveNumber = (value, message) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    throw new ValidationError(message)
  }
}
