
export enum ItemStatus {
  ARRIVED = '現貨',
  PREORDER = '預購',
  NOT_ON_HAND = '非現貨',
  FOR_SALE = '預計出售',
}

export enum ConditionStatus {
  NEW = '全新未拆',
  OPENED = '拆擺過',
}

export enum PaymentStatus {
  PAID_FULL = '已匯全款',
  PAID_DEPOSIT = '已匯訂金',
  COD = '取付', // Cash on Delivery
  FORGOTTEN = '已付款', 
}

export enum SourceType {
  PROXY = '代購',
  SELF = '自購',
}

export interface ProxyService {
  id: string;
  name: string;
  contactInfo?: string;
  website?: string;
  note?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Work {
  id: string;
  name: string;
  categories: Category[];
}

export interface GoodsItem {
  id: string;
  workId: string;
  categoryId: string;
  name: string;
  originalName?: string; 
  condition?: ConditionStatus; // New field
  price: number;
  quantity: number;
  image: string; // Base64
  
  // Source
  sourceType: SourceType;
  proxyId?: string; // If SourceType.PROXY
  purchaseLocation?: string; // If SourceType.SELF
  
  // Status
  status: ItemStatus;
  
  // Payment
  paymentStatus: PaymentStatus;
  depositAmount?: number; // If PaymentStatus.PAID_DEPOSIT
  
  createdAt: number;
}

export type SortOption = 
  | 'created_desc' | 'created_asc'
  | 'price_desc' | 'price_asc'
  | 'total_desc' | 'total_asc'
  | 'quantity_desc' | 'quantity_asc';
