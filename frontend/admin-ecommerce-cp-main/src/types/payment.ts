export enum PaymentType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  DIGITAL_WALLET = 'digital_wallet',
  CRYPTOCURRENCY = 'cryptocurrency',
  OTHER = 'other',
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: PaymentType;
  description: string | null;
  is_active: boolean;
  processing_fee: number;
  min_amount: number | null;
  max_amount: number | null;
  supported_currencies: string[];
  configuration: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodCreate {
  name: string;
  type: PaymentType;
  description?: string;
  is_active?: boolean;
  processing_fee?: number;
  min_amount?: number | null;
  max_amount?: number | null;
  supported_currencies?: string[];
  configuration?: Record<string, any> | null;
}

export interface PaymentMethodUpdate {
  name?: string;
  type?: PaymentType;
  description?: string;
  is_active?: boolean;
  processing_fee?: number;
  min_amount?: number | null;
  max_amount?: number | null;
  supported_currencies?: string[];
  configuration?: Record<string, any> | null;
}

export interface PaymentMethodListParams {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  type?: PaymentType;
}
