/**
 * Currency conversion utilities
 */
import { logger } from './logger';

export interface CurrencyRates {
  USD_TO_KES: number;
  EUR_TO_KES: number;
  GBP_TO_KES: number;
}

/**
 * Get currency conversion rates from environment variables
 */
export const getCurrencyRates = (): CurrencyRates => {
  return {
    USD_TO_KES: parseFloat(process.env.USD_TO_KES_RATE || '150'),
    EUR_TO_KES: parseFloat(process.env.EUR_TO_KES_RATE || '160'),
    GBP_TO_KES: parseFloat(process.env.GBP_TO_KES_RATE || '190'),
  };
};

/**
 * Convert any currency to KES
 */
export const convertToKES = (amount: number, fromCurrency: string): number => {
  const rates = getCurrencyRates();
  
  switch (fromCurrency.toUpperCase()) {
    case 'KES':
      return amount;
    case 'USD':
      return amount * rates.USD_TO_KES;
    case 'EUR':
      return amount * rates.EUR_TO_KES;
    case 'GBP':
      return amount * rates.GBP_TO_KES;
    default:
      return amount;
  }
};

/**
 * Convert KES to any currency
 */
export const convertFromKES = (amount: number, toCurrency: string): number => {
  const rates = getCurrencyRates();
  
  switch (toCurrency.toUpperCase()) {
    case 'KES':
      return amount;
    case 'USD':
      return amount / rates.USD_TO_KES;
    case 'EUR':
      return amount / rates.EUR_TO_KES;
    case 'GBP':
      return amount / rates.GBP_TO_KES;
    default:
      logger.warn(`Unknown currency: ${toCurrency}, returning original amount`);
      return amount;
  }
};

/**
 * Format currency with proper symbol
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    'KES': 'Ksh',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
  };
  
  const symbol = currencySymbols[currency.toUpperCase()] || currency;
  return `${symbol} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
