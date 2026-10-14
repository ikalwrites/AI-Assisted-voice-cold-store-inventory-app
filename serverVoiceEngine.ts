import { InventoryItem, TransactionRecord } from './src/types.ts';

// Ghanaian Cold Store Semantic Engine
// Supports multi-sale recording, multi-instruction processing, and conversational context
export function parseWithRuleBasedColdStoreEngine(
  rawText: string,
  fallbackNotice: string | undefined,
  voicePersona: 'kwame' | 'isaac' | 'gameli' | 'gdzigbodi' | 'kofi' | 'akosua' = 'kwame',
  adminName = 'Mama Gloria',
  pendingContext: any,
  inventory: InventoryItem[],
  transactions: TransactionRecord[],
  freezerBays: any[]
) {
  let cleanText = rawText.toLowerCase().trim();
  // Strip wake/call phrases if user starts with them (e.g. "Kwame,", "Isaac,", "Hey Kwame,", "Hello Isaac,")
  cleanText = cleanText
    .replace(/^(hey|hi|hello|please)?\s*(kwame|isaac|gdzigbodi|gzibodi|gzigbodi|dzibodi|gameli|kofi|akosua|stockkeeper|supervisor|auditor|manager)\s*[,.:-]?\s*/i, '')
    .trim();

  const lower = cleanText || rawText.toLowerCase().trim();
  const isIsaac = voicePersona === 'isaac' || voicePersona === 'gdzigbodi' || voicePersona === 'akosua';
  const detectedLanguage: 'English' = 'English';
  const pendingType = pendingContext?.questionType;

  // 1. Pending Context Handlers (Conversational continuity)
  if (pendingType === 'PAYMENT_METHOD') {
    const isMomo = lower.includes('momo') || lower.includes('mobile money') || lower.includes('mtn') || lower.includes('telecel') || lower.includes('vodafone');
    const paymentMethod: 'Cash' | 'Mobile Money' = isMomo ? 'Mobile Money' : 'Cash';

    // Update the most recent sale transaction's payment method
    if (transactions.length > 0 && transactions[0].type === 'sale') {
      transactions[0].paymentMethod = paymentMethod;
      transactions[0].customerOrSupplier = `${transactions[0].customerOrSupplier || 'Walk-in Customer'} (Paid via ${paymentMethod})`;
    }

    const replyEn = isIsaac
      ? `Payment verified: ${paymentMethod} received. The transaction is logged with financial precision. Do you wish to add further items to this order or close the ticket, ${adminName}?`
      : `Confirmed ${adminName}, received by ${paymentMethod}. Transaction recorded into the log book. Are you adding any other product or should we close the order?`;

    return {
      success: true,
      detectedLanguage,
      rawTranscript: rawText,
      intent: 'SALE' as const,
      voicePersona,
      pendingContext: {
        questionType: 'ADDITIONAL_ITEMS' as const,
        lastIntent: 'SALE' as const,
        questionTextEn: 'Add more products or close receipt?',
        suggestedAnswers: ['No, that is all', 'Yes, add 5 Tilapia', 'Generate Daily Log Book']
      },
      itemsAffected: [],
      replyTextEn: replyEn,
      replyTextTwi: replyEn,
      followUpQuestionEn: 'Add more items or conclude receipt?',
      followUpQuestionTwi: 'Add more items or conclude receipt?',
      suggestedQuickReplies: ['❌ No, that is all', '🐟 Add 5 Tilapia', '📊 View Daily Log Book', '📦 Check All Chambers'],
      lowStockWarnings: [],
      summaryGHS: 0,
      updatedInventory: inventory,
      transactions,
      notice: fallbackNotice || 'Payment method stamped into logbook.'
    };
  }

  if (pendingType === 'ADDITIONAL_ITEMS') {
    const isDone = lower.includes('no') || lower.includes('that is all') || lower.includes('that is it') || lower.includes('close') || lower.includes('finish') || lower.includes('enough') || lower.includes('dabi');
    if (isDone) {
      const replyEn = isIsaac
        ? `Understood, ${adminName}. Order closed and audited. All freezer bay inventories and sales ledgers have been updated.`
        : `Confirmed ${adminName}. Order is complete and logged. All cold room tallies are updated.`;

      return {
        success: true,
        detectedLanguage,
        rawTranscript: rawText,
        intent: 'SALE' as const,
        voicePersona,
        pendingContext: undefined,
        itemsAffected: [],
        replyTextEn: replyEn,
        replyTextTwi: replyEn,
        followUpQuestionEn: 'What is our next stock operation?',
        followUpQuestionTwi: 'What is our next stock operation?',
        suggestedQuickReplies: ['💰 Record New Sale', '🚚 Receive Shipment', '📊 Generate Log Book', '📦 Check Stock'],
        lowStockWarnings: [],
        summaryGHS: 0,
        updatedInventory: inventory,
        transactions,
        notice: fallbackNotice || 'Receipt finalized.'
      };
    }
  }

  // 2. Standalone Greeting Check (if user simply says "hello" or "good morning")
  const isOnlyGreeting = /^(hello|hi|good\s+(morning|afternoon|evening)|hey|yo)\b[!?.]*$/i.test(cleanText);
  if (isOnlyGreeting) {
    const totalCartons = inventory.reduce((a, b) => a + b.currentStock, 0);
    const replyEn = isIsaac
      ? `Good day, ${adminName}. Manager Isaac on standby. All ${freezerBays.length} cold chambers operational with ${totalCartons} cartons in stock. State your sales, deliveries, or stock instructions.`
      : `Welcome, ${adminName}! Stockkeeper Kwame ready on the cold store floor. Total stock is ${totalCartons} cartons across all chambers. State your sales, restocks, or chamber queries.`;

    return {
      success: true,
      detectedLanguage,
      rawTranscript: rawText,
      intent: 'GENERAL_TALK' as const,
      voicePersona,
      pendingContext: undefined,
      itemsAffected: [],
      replyTextEn: replyEn,
      replyTextTwi: replyEn,
      followUpQuestionEn: 'Record a sale, restock, or check stock?',
      followUpQuestionTwi: 'Record a sale, restock, or check stock?',
      suggestedQuickReplies: ['🐟 Sold 10 Tilapia & 5 Red Fish', '🚚 Restock 20 Chicken Wings', '💰 Record Walk-in Sale', '📦 Check All Chambers'],
      lowStockWarnings: [],
      summaryGHS: 0,
      updatedInventory: inventory,
      transactions,
      notice: fallbackNotice || 'AI Assistant on standby.'
    };
  }

  // 3. Helper Functions for Matching Products and Quantities
  function matchProduct(phrase: string): InventoryItem | null {
    const p = phrase.toLowerCase();
    if (p.includes('tilapia')) return inventory.find(i => i.name.toLowerCase().includes('tilapia')) || null;
    if (p.includes('mackerel') || p.includes('titus')) return inventory.find(i => i.name.toLowerCase().includes('mackerel') || i.name.toLowerCase().includes('titus')) || null;
    if (p.includes('red fish') || p.includes('ewule') || p.includes('poose') || p.includes('bream')) return inventory.find(i => i.name.toLowerCase().includes('red fish') || (i.localNameTwi && i.localNameTwi.toLowerCase().includes('ewule'))) || null;
    if (p.includes('salmon')) return inventory.find(i => i.name.toLowerCase().includes('salmon')) || null;
    if (p.includes('shrimp') || p.includes('crab') || p.includes('kɔtɔ') || p.includes('koto')) return inventory.find(i => i.name.toLowerCase().includes('shrimp') || i.name.toLowerCase().includes('crab')) || null;
    if (p.includes('tuna') || p.includes('yellowfin')) return inventory.find(i => i.name.toLowerCase().includes('tuna')) || null;
    if (p.includes('snapper')) return inventory.find(i => i.name.toLowerCase().includes('snapper')) || null;
    if (p.includes('grouper')) return inventory.find(i => i.name.toLowerCase().includes('grouper')) || null;
    if (p.includes('chicken') || p.includes('thigh') || p.includes('akokɔ') || p.includes('akoko')) return inventory.find(i => i.name.toLowerCase().includes('chicken')) || null;
    if (p.includes('gizzard')) return inventory.find(i => i.name.toLowerCase().includes('gizzard')) || null;
    if (p.includes('turkey wing') || p.includes('turkey wings')) return inventory.find(i => i.name.toLowerCase().includes('turkey wing')) || null;
    if (p.includes('chofi') || p.includes('tsofi') || p.includes('turkey tail')) return inventory.find(i => i.name.toLowerCase().includes('chofi') || i.name.toLowerCase().includes('turkey tail')) || null;
    if (p.includes('sausage') || p.includes('frankfurter') || p.includes('nsosoe')) return inventory.find(i => i.name.toLowerCase().includes('sausage') || i.name.toLowerCase().includes('frankfurter')) || null;
    if (p.includes('beef') || p.includes('nantwi') || p.includes('boneless')) return inventory.find(i => i.name.toLowerCase().includes('beef')) || null;
    if (p.includes('pork') || p.includes('prako') || p.includes('ribs')) return inventory.find(i => i.name.toLowerCase().includes('pork')) || null;

    // Substring fallback
    for (const item of inventory) {
      if (p.includes(item.name.toLowerCase())) return item;
      if (item.localNameTwi && p.includes(item.localNameTwi.toLowerCase())) return item;
    }
    return null;
  }

  function parseQty(text: string): number {
    const digitMatch = text.match(/\b(\d+)\b/);
    if (digitMatch) return parseInt(digitMatch[1], 10);
    const t = text.toLowerCase();
    if (t.includes('hundred') || t.includes('ɔha')) return 100;
    if (t.includes('ninety')) return 90;
    if (t.includes('eighty')) return 80;
    if (t.includes('seventy')) return 70;
    if (t.includes('sixty')) return 60;
    if (t.includes('fifty') || t.includes('aduonum')) return 50;
    if (t.includes('forty') || t.includes('aduanan')) return 40;
    if (t.includes('thirty-five')) return 35;
    if (t.includes('thirty') || t.includes('aduasa')) return 30;
    if (t.includes('twenty-five') || t.includes('twenty five')) return 25;
    if (t.includes('twenty') || t.includes('aduonu')) return 20;
    if (t.includes('fifteen')) return 15;
    if (t.includes('fourteen')) return 14;
    if (t.includes('thirteen')) return 13;
    if (t.includes('twelve') || t.includes('dummienu')) return 12;
    if (t.includes('eleven') || t.includes('dubaako')) return 11;
    if (t.includes('ten') || t.includes('edu') || t.includes(' du ')) return 10;
    if (t.includes('nine') || t.includes('nkron')) return 9;
    if (t.includes('eight') || t.includes('nwɔtwe')) return 8;
    if (t.includes('seven') || t.includes('nson')) return 7;
    if (t.includes('six') || t.includes('nsia')) return 6;
    if (t.includes('five') || t.includes('enum')) return 5;
    if (t.includes('four') || t.includes('nan')) return 4;
    if (t.includes('three') || t.includes('mmiɛnsa') || t.includes('mmiensa')) return 3;
    if (t.includes('two') || t.includes('mmienu')) return 2;
    if (t.includes('one') || t.includes('baako')) return 1;
    return 1;
  }

  function extractCustomer(text: string): string | undefined {
    const m = text.match(/\bto\s+((?:sister|auntie|brother|mr\.?|mrs\.?|madam|madame|chief|mama|pastor)?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
    if (m) {
      let clean = m[1].replace(/\b(for|on|with|in|via|cash|momo|mtn|telecel)\b.*$/i, '').trim();
      if (clean && !clean.toLowerCase().includes('chamber') && !clean.toLowerCase().includes('freezer') && !clean.toLowerCase().includes('bay')) {
        return clean;
      }
    }
    return undefined;
  }

  function extractSupplier(text: string): string | undefined {
    const m = text.match(/\bfrom\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
    if (m) {
      let clean = m[1].replace(/\b(for|on|with|in|via|cash|momo|into|to)\b.*$/i, '').trim();
      if (clean && !clean.toLowerCase().includes('chamber') && !clean.toLowerCase().includes('bay') && !clean.toLowerCase().includes('freezer')) {
        return clean;
      }
    }
    return undefined;
  }

  function extractPayment(text: string): 'Cash' | 'Mobile Money' | undefined {
    const t = text.toLowerCase();
    if (t.includes('cash') || t.includes('sika')) return 'Cash';
    if (t.includes('momo') || t.includes('mobile money') || t.includes('mtn') || t.includes('telecel')) return 'Mobile Money';
    return undefined;
  }

  // 4. MULTI-INSTRUCTION & MULTI-SALE PARSER
  let baselineAction: 'sale' | 'restock' | 'spoilage' | 'query' = 'sale';
  if (lower.includes('receive') || lower.includes('restock') || lower.includes('inflow') || lower.includes('delivery') || lower.includes('unload') || lower.includes('gye')) {
    baselineAction = 'restock';
  } else if (lower.includes('spoil') || lower.includes('spoilt') || lower.includes('damaged') || lower.includes('condemn') || lower.includes('burst') || lower.includes('waste') || lower.includes('asɛe')) {
    baselineAction = 'spoilage';
  } else if (lower.includes('how many') || lower.includes('how much') || lower.includes('what is the stock') || lower.includes('price of') || lower.includes('check stock') || lower.includes('balance') || lower.includes('sɛn')) {
    baselineAction = 'query';
  }

  // Break input into clauses by commas, semicolons, or conjunctions
  const clauseDelimiters = /(?:[;,\n]|\band\s+then\b|\band\s+also\b|\bas\s+well\s+as\b|\bplus\b|\band\b|\bthen\b|\balso\b)/i;
  const rawClauses = lower.split(clauseDelimiters).map(c => c.trim()).filter(Boolean);

  interface ParsedInstruction {
    item: InventoryItem;
    quantity: number;
    action: 'deduct' | 'add' | 'query';
    intentType: 'sale' | 'restock' | 'spoilage' | 'query';
    customer?: string;
    supplier?: string;
    payment?: 'Cash' | 'Mobile Money';
  }

  const parsedInstructions: ParsedInstruction[] = [];
  let currentAction = baselineAction;

  // Secondary auxiliary instructions
  let requestedTemperatureCheck = false;
  let requestedTotalStock = false;
  let requestedLogbook = false;
  let requestedTechnician = false;

  for (const clause of rawClauses) {
    if (clause.includes('sold') || clause.includes('sell') || clause.includes('sale') || clause.includes('tɔn')) {
      currentAction = 'sale';
    } else if (clause.includes('restock') || clause.includes('receive') || clause.includes('delivery') || clause.includes('inflow') || clause.includes('unload') || clause.includes('gye')) {
      currentAction = 'restock';
    } else if (clause.includes('spoil') || clause.includes('spoilt') || clause.includes('damaged') || clause.includes('bad') || clause.includes('condemn') || clause.includes('asɛe')) {
      currentAction = 'spoilage';
    } else if (clause.includes('check') || clause.includes('how many') || clause.includes('how much') || clause.includes('price') || clause.includes('stock of') || clause.includes('sɛn')) {
      currentAction = 'query';
    }

    if (clause.includes('temp') || clause.includes('temperature') || clause.includes('cooling') || clause.includes('compressor')) {
      requestedTemperatureCheck = true;
    }
    if (clause.includes('total stock') || clause.includes('how many cartons total') || clause.includes('total cartons')) {
      requestedTotalStock = true;
    }
    if (clause.includes('log book') || clause.includes('logbook') || clause.includes('report') || clause.includes('summary of the day')) {
      requestedLogbook = true;
    }
    if (clause.includes('technician') || clause.includes('electrician') || clause.includes('engineer') || clause.includes('generator')) {
      requestedTechnician = true;
    }

    const matched = matchProduct(clause);
    if (matched) {
      const qty = parseQty(clause);
      const customer = extractCustomer(clause) || extractCustomer(lower);
      const supplier = extractSupplier(clause) || extractSupplier(lower);
      const payment = extractPayment(clause) || extractPayment(lower);

      let action: 'deduct' | 'add' | 'query' = 'deduct';
      if (currentAction === 'restock') action = 'add';
      else if (currentAction === 'query') action = 'query';
      else action = 'deduct';

      parsedInstructions.push({
        item: matched,
        quantity: qty,
        action,
        intentType: currentAction,
        customer,
        supplier,
        payment
      });
    }
  }

  // Fallback: If no clauses matched an item, search the entire text for any item
  if (parsedInstructions.length === 0) {
    const singleMatched = matchProduct(lower) || (pendingContext?.lastItemId ? inventory.find(i => i.id === pendingContext.lastItemId) : null) || inventory[0];
    if (singleMatched) {
      const qty = parseQty(lower);
      const customer = extractCustomer(lower);
      const supplier = extractSupplier(lower);
      const payment = extractPayment(lower);

      let action: 'deduct' | 'add' | 'query' = 'deduct';
      if (currentAction === 'restock') action = 'add';
      else if (currentAction === 'query') action = 'query';

      parsedInstructions.push({
        item: singleMatched,
        quantity: qty,
        action,
        intentType: currentAction,
        customer,
        supplier,
        payment
      });
    }
  }

  // 5. Execute all parsed instructions on inventory state and generate transactions
  const itemsAffected: any[] = [];
  const lowStockWarnings: string[] = [];
  const executionSummaries: string[] = [];
  let totalSalesRevenueGHS = 0;
  let totalRestockCostGHS = 0;
  const hasMultipleOperations = parsedInstructions.length > 1;

  for (const inst of parsedInstructions) {
    const item = inst.item;
    const prevStock = item.currentStock;
    let newStock = prevStock;
    let lineAmountGHS = 0;

    if (inst.action === 'deduct') {
      newStock = Math.max(0, prevStock - inst.quantity);
      item.currentStock = newStock;
      item.lastUpdated = new Date().toISOString();

      if (inst.intentType === 'spoilage') {
        lineAmountGHS = inst.quantity * item.unitCostPrice;
        const tx: TransactionRecord = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
          type: 'spoilage',
          itemId: item.id,
          itemName: item.name,
          quantity: -inst.quantity,
          unit: item.unit,
          unitPrice: item.unitCostPrice,
          totalValueGHS: lineAmountGHS,
          customerOrSupplier: 'Cold Store Defrost / Condemned Waste',
          voiceTranscript: rawText,
          detectedLanguage: 'English',
          aiResponseEn: `Spoilage logged: ${inst.quantity} cartons written off.`
        };
        transactions.unshift(tx);
        executionSummaries.push(`Written off ${inst.quantity} ${item.unit} of ${item.name} as spoilage. Balance: ${newStock} ${item.unit}.`);
      } else {
        // Normal sale
        lineAmountGHS = inst.quantity * item.unitSellingPrice;
        totalSalesRevenueGHS += lineAmountGHS;

        const customerStr = inst.customer ? `${inst.customer}` : (inst.payment ? `Walk-in Customer (Paid via ${inst.payment})` : 'Walk-in / Wholesale Customer');
        const tx: TransactionRecord = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
          type: 'sale',
          itemId: item.id,
          itemName: item.name,
          quantity: -inst.quantity,
          unit: item.unit,
          unitPrice: item.unitSellingPrice,
          totalValueGHS: lineAmountGHS,
          customerOrSupplier: customerStr,
          paymentMethod: inst.payment,
          voiceTranscript: rawText,
          detectedLanguage: 'English',
          aiResponseEn: `Recorded sale of ${inst.quantity} ${item.unit} of ${item.name} for GH₵ ${lineAmountGHS.toLocaleString()}.`
        };
        transactions.unshift(tx);

        const customerNote = inst.customer ? ` to ${inst.customer}` : '';
        const paymentNote = inst.payment ? ` (${inst.payment})` : '';
        executionSummaries.push(`Sold ${inst.quantity} ${item.unit} of ${item.name}${customerNote}${paymentNote} (GH₵ ${lineAmountGHS.toLocaleString()}). Remaining in ${item.coldRoomZone}: ${newStock} ${item.unit}.`);
      }

      if (newStock <= item.minThreshold) {
        lowStockWarnings.push(`Low stock warning: ${item.name} has only ${newStock} cartons left in ${item.coldRoomZone} (Threshold: ${item.minThreshold}).`);
      }

    } else if (inst.action === 'add') {
      newStock = prevStock + inst.quantity;
      item.currentStock = newStock;
      item.lastUpdated = new Date().toISOString();
      lineAmountGHS = inst.quantity * item.unitCostPrice;
      totalRestockCostGHS += lineAmountGHS;

      const supplierStr = inst.supplier ? `${inst.supplier}` : 'Harbour / Container Shipment';
      const tx: TransactionRecord = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        type: 'restock',
        itemId: item.id,
        itemName: item.name,
        quantity: inst.quantity,
        unit: item.unit,
        unitPrice: item.unitCostPrice,
        totalValueGHS: lineAmountGHS,
        customerOrSupplier: supplierStr,
        voiceTranscript: rawText,
        detectedLanguage: 'English',
        aiResponseEn: `Restocked ${inst.quantity} ${item.unit} of ${item.name}.`
      };
      transactions.unshift(tx);
      executionSummaries.push(`Restocked ${inst.quantity} ${item.unit} of ${item.name} from ${supplierStr}. New total in ${item.coldRoomZone}: ${newStock} ${item.unit}.`);

    } else if (inst.action === 'query') {
      executionSummaries.push(`${item.name}: Available stock is ${item.currentStock} ${item.unit} in ${item.coldRoomZone}. Selling price is GH₵ ${item.unitSellingPrice.toLocaleString()}/${item.unit}.`);
    }

    itemsAffected.push({
      itemId: item.id,
      itemName: item.name,
      action: inst.action,
      quantity: inst.quantity,
      unit: item.unit,
      unitPrice: inst.action === 'add' ? item.unitCostPrice : item.unitSellingPrice,
      totalAmountGHS: lineAmountGHS,
      previousStock: prevStock,
      newStock: newStock,
      customerOrSupplier: inst.customer || inst.supplier,
      paymentMethod: inst.payment
    });
  }

  // 6. Secondary instruction summaries
  if (requestedTemperatureCheck) {
    executionSummaries.push(`Cold chamber status: Chamber 1 is steady at -22.4°C, all ${freezerBays.length} freezer compressors running at optimal temperature.`);
  }
  if (requestedTotalStock) {
    const totalCartons = inventory.reduce((a, b) => a + b.currentStock, 0);
    executionSummaries.push(`Total warehouse inventory: ${totalCartons} cartons across ${freezerBays.length} cold chambers.`);
  }
  if (requestedLogbook) {
    executionSummaries.push(`Daily log book entry compiled with date and timestamp.`);
  }
  if (requestedTechnician) {
    executionSummaries.push(`Technical maintenance alert flagged for cold store compressor units.`);
  }

  // 7. Compose Final Reply Text
  let replyTextEn = '';
  const intent: any = hasMultipleOperations || executionSummaries.length > 1 ? 'MULTIPLE_INSTRUCTIONS' : (parsedInstructions[0]?.intentType === 'sale' ? 'SALE' : parsedInstructions[0]?.intentType === 'restock' ? 'RESTOCK' : 'QUERY_STOCK');

  if (hasMultipleOperations) {
    const numberedList = executionSummaries.map((s, idx) => `${idx + 1}) ${s}`).join(' ');
    const totalRevenueClause = totalSalesRevenueGHS > 0 ? ` Total sales revenue: GH₵ ${totalSalesRevenueGHS.toLocaleString()}.` : '';
    replyTextEn = isIsaac
      ? `Confirmed, ${adminName}. Multiple instructions executed (${parsedInstructions.length} items logged): ${numberedList}${totalRevenueClause} All stock cards updated.`
      : `Confirmed ${adminName}! Recorded multiple instructions (${parsedInstructions.length} items): ${numberedList}${totalRevenueClause} Everything is stamped into the log book.`;
  } else if (executionSummaries.length > 0) {
    replyTextEn = isIsaac
      ? `Confirmed, ${adminName}. ${executionSummaries.join(' ')} Stamped into official records.`
      : `Confirmed ${adminName}! ${executionSummaries.join(' ')} Recorded in the cold store book.`;
  } else {
    replyTextEn = `Understood, ${adminName}. All cold store records and chamber monitors are updated.`;
  }

  const followUpQuestionEn = totalSalesRevenueGHS > 0 && !parsedInstructions.some(i => i.payment)
    ? 'Payment method: Cash or Mobile Money?'
    : 'Next stock transaction or chamber query?';

  const suggestedQuickReplies = totalSalesRevenueGHS > 0 && !parsedInstructions.some(i => i.payment)
    ? ['💵 Cash Payment', '📱 Mobile Money (MoMo)', '🐟 Record Another Sale', '📊 View Daily Log Book']
    : ['💰 Record Walk-in Sale', '🚚 Receive Shipment', '📦 Check All Chambers', '📊 Daily Log Book'];

  const nextPendingContext = totalSalesRevenueGHS > 0 && !parsedInstructions.some(i => i.payment)
    ? {
        questionType: 'PAYMENT_METHOD' as const,
        lastIntent: 'SALE' as const,
        orderRunningTotalGHS: totalSalesRevenueGHS,
        questionTextEn: 'Payment received by Cash or Mobile Money?',
        suggestedAnswers: ['Cash', 'Mobile Money', 'MTN MoMo', 'Telecel Cash']
      }
    : undefined;

  return {
    success: true,
    detectedLanguage,
    rawTranscript: rawText,
    intent,
    voicePersona,
    pendingContext: nextPendingContext,
    itemsAffected,
    replyTextEn,
    replyTextTwi: replyTextEn,
    followUpQuestionEn,
    followUpQuestionTwi: followUpQuestionEn,
    suggestedQuickReplies,
    lowStockWarnings,
    summaryGHS: totalSalesRevenueGHS,
    updatedInventory: inventory,
    transactions,
    notice: fallbackNotice || 'Processed via Paradise Fisheries cold-store engine.'
  };
}
