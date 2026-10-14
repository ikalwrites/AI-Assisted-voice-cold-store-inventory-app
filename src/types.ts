export type CategoryType = 'fish' | 'poultry' | 'meat' | 'sausage' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  localNameTwi: string;
  category: CategoryType;
  currentStock: number;
  unit: string; // 'cartons', 'boxes', 'kg', 'packs'
  minThreshold: number;
  unitSellingPrice: number; // in Ghana Cedis GH₵
  unitCostPrice: number; // in Ghana Cedis GH₵
  coldRoomZone: string;
  image: string;
  lastUpdated: string;
  description: string;
  assignedStocker?: string; // e.g. Kwame, Isaac, Mama Gloria, Boss Isaac, or staff
}

export type TransactionType = 'sale' | 'restock' | 'spoilage' | 'adjustment';

export interface TransactionRecord {
  id: string;
  timestamp: string;
  type: TransactionType;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValueGHS: number;
  customerOrSupplier?: string;
  paymentMethod?: 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Consignment Delivery';
  voiceTranscript?: string;
  detectedLanguage?: 'Twi' | 'English' | 'Mixed';
  aiResponseEn?: string;
  aiResponseTwi?: string;
}

export type VoicePersona = 'kwame' | 'isaac' | 'gameli' | 'gdzigbodi' | 'kofi' | 'akosua';

// Speech & Response Pacing options for Ghanaian respectful communication
export type SpeechPacing = 'dignified' | 'natural' | 'swift';

export type PendingQuestionType =
  | 'PAYMENT_METHOD'
  | 'ADDITIONAL_ITEMS'
  | 'SUPPLIER_CHECK'
  | 'TECHNICIAN_ALERT'
  | 'CONFIRM_SALE'
  | 'LOGBOOK_REVIEW'
  | 'NEXT_ACTION'
  | 'GENERAL';

export interface PendingDialogueContext {
  questionType: PendingQuestionType;
  lastIntent?: 'SALE' | 'RESTOCK' | 'QUERY_STOCK' | 'QUERY_PRICE' | 'SPOILAGE' | 'BUSINESS_ADVICE' | 'GENERATE_LOGBOOK' | 'GENERAL_TALK';
  lastItemId?: string;
  lastItemName?: string;
  lastQuantity?: number;
  orderRunningTotalGHS?: number;
  questionTextEn?: string;
  questionTextTwi?: string;
  suggestedAnswers?: string[];
  activeStep?: string;
}

export interface VoiceProcessResult {
  success: boolean;
  detectedLanguage: 'Twi' | 'English' | 'Mixed';
  rawTranscript: string;
  intent: 'SALE' | 'RESTOCK' | 'QUERY_STOCK' | 'QUERY_PRICE' | 'SPOILAGE' | 'BUSINESS_ADVICE' | 'GENERATE_LOGBOOK' | 'GENERAL_TALK';
  voicePersona?: VoicePersona;
  pendingContext?: PendingDialogueContext;
  itemsAffected: Array<{
    itemId: string;
    itemName: string;
    action: 'deduct' | 'add' | 'query' | 'report';
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmountGHS: number;
    previousStock: number;
    newStock: number;
  }>;
  replyTextEn: string;
  replyTextTwi: string;
  followUpQuestionEn?: string;
  followUpQuestionTwi?: string;
  suggestedQuickReplies?: string[];
  audioBase64?: string;
  speechTextToPlay?: string;
  summaryGHS?: number;
  lowStockWarnings?: string[];
  updatedInventory?: InventoryItem[];
  transactions?: TransactionRecord[];
  newTransaction?: TransactionRecord;
  notice?: string;
  emptyInput?: boolean;
}

export interface ConversationTurn {
  id: string;
  speaker: 'admin' | 'yami';
  textEn: string;
  textTwi?: string;
  timestamp: string;
  intent?: string;
  voicePersona?: VoicePersona;
  pendingContext?: PendingDialogueContext;
  followUpQuestion?: string;
  followUpQuestionTwi?: string;
  suggestedReplies?: string[];
  isGreeting?: boolean;
  audioBase64?: string | null;
  itemsAffected?: Array<{
    itemName: string;
    action: string;
    quantity: number;
    unit: string;
    previousStock: number;
    newStock: number;
  }>;
  summaryGHS?: number;
}

export interface InventoryStats {
  totalItemsCount: number;
  totalCartonsInStock: number;
  totalInventoryValueGHS: number;
  lowStockAlertsCount: number;
  todaySalesGHS: number;
  todayCartonsSold: number;
}

// Timely stock tracking & End-of-Day Log Book interfaces
export interface TimelyItemMovement {
  itemId: string;
  itemName: string;
  localNameTwi: string;
  category: CategoryType;
  coldRoomZone: string;
  openingStock: number;
  receivedStock: number;
  soldStock: number;
  damagedStock: number;
  closingStock: number;
  unit: string;
  unitSellingPrice: number;
  unitCostPrice: number;
  salesValueGHS: number;
  lastMovementTime?: string;
  lastMovementType?: TransactionType;
  lastMovementQty?: number;
  status: 'optimal' | 'warning' | 'critical';
}

export interface DailyLogBookReport {
  date: string;
  generatedAt: string;
  storeName: string;
  location: string;
  dutyOfficer: string;
  dutyPersona: VoicePersona;
  supervisorName: string;
  shiftPeriod: string;
  metrics: {
    openingCartons: number;
    closingCartons: number;
    cartonsSold: number;
    cartonsReceived: number;
    cartonsDamaged: number;
    grossSalesGHS: number;
    cashSalesGHS: number;
    momoSalesGHS: number;
    bankTransferGHS: number;
    netValuationGHS: number;
  };
  itemLedger: TimelyItemMovement[];
  hourlyTimeline: Array<{
    id: string;
    time: string;
    itemName: string;
    type: TransactionType;
    quantity: number;
    unit: string;
    amountGHS: number;
    paymentMode?: string;
    party?: string;
  }>;
  freezerTemperatures: Array<{
    bay: string;
    zoneName: string;
    tempCelsius: number;
    status: 'optimal' | 'warning';
    notes: string;
  }>;
  lowStockAlerts: string[];
  stockkeeperNotes: string;
  officialSealNumber: string;
}

export interface FreezerBayConfig {
  id: string;
  name: string;
  nameTwi?: string;
  tempCelsius: number;
  capacityCartons: number;
  powerSource: string;
  status: 'Optimal Freezing' | 'Warning' | 'Defrosting';
  assignedCategory?: CategoryType;
}


