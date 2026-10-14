import { parseWithRuleBasedColdStoreEngine as runColdStoreEngine } from "./serverVoiceEngine.ts";
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_INVENTORY, INITIAL_TRANSACTIONS } from './src/data/initialInventory.ts';
import { InventoryItem, TransactionRecord } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '30mb' }));

// In-memory Cold Store Inventory State
let inventory: InventoryItem[] = JSON.parse(JSON.stringify(INITIAL_INVENTORY));
let transactions: TransactionRecord[] = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));

function getChamberTemplate(chamberNum: number) {
  const templates: Record<number, { name: string; nameTwi: string; tempCelsius: number; capacityCartons: number; category: any }> = {
    1: { name: 'Chamber 1 - Pelagic Sea Catch & Fresh Frozen Fish', nameTwi: 'Chamber 1 - Nsuomnam & Po Mu Nam', tempCelsius: -22.4, capacityCartons: 800, category: 'fish' },
    2: { name: 'Chamber 2 - High-Seas Mackerel & Sardinella Bay', nameTwi: 'Chamber 2 - Titus & Nsuomnam Kɛseɛ', tempCelsius: -21.8, capacityCartons: 750, category: 'fish' },
    3: { name: 'Chamber 3 - Crustaceans, Shrimps & Lobster Export Deck', nameTwi: 'Chamber 3 - Nsuom Kɔtɔ, Mmɔbɔrɔ & Export', tempCelsius: -24.5, capacityCartons: 600, category: 'fish' },
    4: { name: 'Chamber 4 - Commercial Yellowfin Tuna & Big Catch Vault', nameTwi: 'Chamber 4 - Po mu Tuna & Nantwi Bay', tempCelsius: -26.0, capacityCartons: 900, category: 'fish' },
    5: { name: 'Chamber 5 - Poultry & Cold Storage Holding Bay', nameTwi: 'Chamber 5 - Akokɔ & Akwantuo Mmerɛw', tempCelsius: -19.4, capacityCartons: 650, category: 'poultry' },
    6: { name: 'Chamber 6 - Deli, Specialty Sausages & Carcass Reserve', nameTwi: 'Chamber 6 - Sausages, Nsosoe & Meat Reserve', tempCelsius: -18.2, capacityCartons: 500, category: 'sausage' },
    7: { name: 'Chamber 7 - Deep Meat & Carcass Vault', nameTwi: 'Chamber 7 - Nantwi & Prako Deep Meat', tempCelsius: -23.5, capacityCartons: 700, category: 'meat' },
    8: { name: 'Chamber 8 - Blast Freezer & Rapid Freezing Hold', nameTwi: 'Chamber 8 - Blast Freezer Kɛseɛ', tempCelsius: -30.0, capacityCartons: 600, category: 'fish' },
    9: { name: 'Chamber 9 - Deep-Sea Red Snapper & Grouper Cold Deck', nameTwi: 'Chamber 9 - Ewule & Po Mu Nsuomnam', tempCelsius: -22.0, capacityCartons: 800, category: 'fish' },
    10: { name: 'Chamber 10 - Export Fillet & Packaged Seafood Reserve', nameTwi: 'Chamber 10 - Export Packaged Fish', tempCelsius: -25.0, capacityCartons: 850, category: 'fish' },
    11: { name: 'Chamber 11 - Port Arrival Quarantine & Buffer Hold', nameTwi: 'Chamber 11 - Port Container Arrival Hold', tempCelsius: -20.0, capacityCartons: 650, category: 'fish' },
    12: { name: 'Chamber 12 - Deep-Freeze Mega Vault & Reserve Fleet', nameTwi: 'Chamber 12 - Mega Cold Complex Deck', tempCelsius: -28.0, capacityCartons: 1200, category: 'fish' },
  };

  const t = templates[chamberNum] || {
    name: `Chamber ${chamberNum} - Commercial Cold Expansion Bay`,
    nameTwi: `Chamber ${chamberNum} - Cold Store Bea`,
    tempCelsius: -22.0,
    capacityCartons: 700,
    category: 'fish'
  };

  return {
    id: `bay-${chamberNum}`,
    name: t.name,
    nameTwi: t.nameTwi,
    tempCelsius: t.tempCelsius,
    capacityCartons: t.capacityCartons,
    powerSource: 'Industrial 3-Phase ECG + 500kVA Standby Genset',
    status: 'Optimal Freezing' as const,
    assignedCategory: t.category,
  };
}

// Initial 6 Cold Chambers Fleet for Paradise Fisheries Enterprise
let freezerBays = [1, 2, 3, 4, 5, 6].map(num => getChamberTemplate(num));

// Initialize Gemini SDK lazily
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. GET Inventory & Stats
app.get('/api/inventory', (req, res) => {
  const totalCartonsInStock = inventory.reduce((acc, item) => acc + item.currentStock, 0);
  const totalInventoryValueGHS = inventory.reduce((acc, item) => acc + (item.currentStock * item.unitSellingPrice), 0);
  const lowStockAlertsCount = inventory.filter(item => item.currentStock <= item.minThreshold).length;
  
  // Calculate today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySales = transactions.filter(t => t.type === 'sale' && t.timestamp.startsWith(today));
  const todaySalesGHS = todaySales.reduce((acc, t) => acc + t.totalValueGHS, 0);
  const todayCartonsSold = todaySales.reduce((acc, t) => acc + Math.abs(t.quantity), 0);

  res.json({
    inventory,
    stats: {
      totalItemsCount: inventory.length,
      totalCartonsInStock,
      totalInventoryValueGHS,
      lowStockAlertsCount,
      todaySalesGHS,
      todayCartonsSold,
    }
  });
});

// 2. Manual Update / Edit Item
app.post('/api/inventory/update', (req, res) => {
  const updatedItem: InventoryItem = req.body;
  if (!updatedItem || !updatedItem.id) {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  const index = inventory.findIndex(item => item.id === updatedItem.id);
  if (index >= 0) {
    const prevStock = inventory[index].currentStock;
    inventory[index] = { ...inventory[index], ...updatedItem, lastUpdated: new Date().toISOString() };
    
    // Log adjustment if stock manually changed without a dedicated transaction
    if (prevStock !== updatedItem.currentStock && !req.query.skipAutoTx) {
      const diff = updatedItem.currentStock - prevStock;
      const record: TransactionRecord = {
        id: `tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: diff > 0 ? 'restock' : 'adjustment',
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        quantity: diff,
        unit: updatedItem.unit,
        unitPrice: updatedItem.unitSellingPrice,
        totalValueGHS: Math.abs(diff) * updatedItem.unitSellingPrice,
        customerOrSupplier: 'Manual Storekeeper Update',
        voiceTranscript: `Manual inventory adjustment: ${diff > 0 ? '+' : ''}${diff} ${updatedItem.unit}`,
        detectedLanguage: 'English',
        aiResponseEn: `Manually updated ${updatedItem.name}. Stock changed by ${diff > 0 ? '+' : ''}${diff} ${updatedItem.unit}. New balance: ${updatedItem.currentStock}.`,
        aiResponseTwi: `Woasakra ${updatedItem.localNameTwi || updatedItem.name} nkyerɛwee. Ka a aka seesei yɛ ${updatedItem.currentStock}.`
      };
      transactions.unshift(record);
    }
    return res.json({ success: true, item: inventory[index] });
  }

  // If not found, add new
  inventory.push(updatedItem);
  res.json({ success: true, item: updatedItem });
});

// 3. Add New Item
app.post('/api/inventory/add', (req, res) => {
  const newItem: InventoryItem = {
    ...req.body,
    id: req.body.id || `cs-${Date.now()}`,
    lastUpdated: new Date().toISOString()
  };
  inventory.push(newItem);
  res.json({ success: true, item: newItem });
});

// 4. GET Transactions
app.get('/api/transactions', (req, res) => {
  res.json({ transactions });
});

// 4.0 POST Add Manual Transaction
app.post('/api/transactions/add', (req, res) => {
  const body = req.body;
  if (!body || !body.itemId || !body.type) {
    return res.status(400).json({ error: 'itemId and type are required' });
  }

  const newTx: TransactionRecord = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    type: body.type,
    itemId: body.itemId,
    itemName: body.itemName || 'Inventory Item',
    quantity: body.quantity || 0,
    unit: body.unit || 'cartons',
    unitPrice: body.unitPrice || 0,
    totalValueGHS: body.totalValueGHS || 0,
    customerOrSupplier: body.customerOrSupplier || 'Manual Admin Entry',
    voiceTranscript: body.voiceTranscript || `Manual ${body.type} logged by admin`,
    detectedLanguage: 'English',
    aiResponseEn: body.aiResponseEn || `Recorded ${body.type} of ${Math.abs(body.quantity)} ${body.unit} for ${body.itemName}.`,
  };

  transactions.unshift(newTx);
  res.json({ success: true, transaction: newTx });
});

// 4.01 DELETE Transaction Records (Secret Tab authorized: Rejoice Logo / RL)
app.post('/api/transactions/delete', (req, res) => {
  const { id, ids } = req.body;
  if (ids && Array.isArray(ids)) {
    const initialLen = transactions.length;
    transactions = transactions.filter(t => !ids.includes(t.id));
    return res.json({ success: true, deletedCount: initialLen - transactions.length });
  }
  if (id) {
    const initialLen = transactions.length;
    transactions = transactions.filter(t => t.id !== id);
    return res.json({ success: true, deletedId: id, deletedCount: initialLen - transactions.length });
  }
  res.status(400).json({ error: 'id or ids array required' });
});

// 4.02 CLEAR / RESET Transactions (Secret Tab authorized)
app.post('/api/transactions/clear-all', (req, res) => {
  const keepCount = req.body.keepCount || 0;
  if (keepCount > 0) {
    transactions = transactions.slice(0, keepCount);
  } else {
    transactions = [];
  }
  res.json({ success: true, remainingCount: transactions.length });
});

// 4.03 DELETE Inventory Item (Secret Tab authorized)
app.post('/api/inventory/delete', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  const initialLen = inventory.length;
  inventory = inventory.filter(item => item.id !== id);
  res.json({ success: true, deletedId: id, count: initialLen - inventory.length });
});

// 4.04 GET & UPDATE Freezer Bays
app.get('/api/freezer-bays', (req, res) => {
  res.json({ success: true, bays: freezerBays });
});

app.post('/api/freezer-bays/update', (req, res) => {
  const { bays, bay, oldName, bayNumber } = req.body;
  if (bays && Array.isArray(bays)) {
    freezerBays = bays;
    return res.json({ success: true, bays: freezerBays, inventory });
  }
  if (bay && bay.id) {
    const idx = freezerBays.findIndex(b => b.id === bay.id);
    const prevBay = idx >= 0 ? freezerBays[idx] : null;
    const previousName = oldName || prevBay?.name || '';
    const bNumber = bayNumber || (idx >= 0 ? idx + 1 : 1);

    if (idx >= 0) {
      freezerBays[idx] = { ...freezerBays[idx], ...bay };
    } else {
      freezerBays.push(bay);
    }

    const updatedBay = freezerBays[idx >= 0 ? idx : freezerBays.length - 1];

    // Cascade bay name change to all corresponding inventory items
    if (updatedBay.name) {
      inventory = inventory.map(item => {
        const zone = (item.coldRoomZone || '').toLowerCase();
        const matchesPrev = previousName && zone.includes(previousName.toLowerCase());
        const matchesNum = zone.includes(`bay ${bNumber}`) || zone.includes(`chamber ${bNumber}`);
        const matchesId = zone.includes(bay.id.toLowerCase());
        const matchesDefaultCategory =
          (bNumber === 1 && item.category === 'fish' && !zone.includes('bay 2') && !zone.includes('bay 3') && !zone.includes('bay 4')) ||
          (bNumber === 2 && item.category === 'poultry' && !zone.includes('bay 1') && !zone.includes('bay 3') && !zone.includes('bay 4')) ||
          (bNumber === 3 && item.category === 'sausage' && !zone.includes('bay 1') && !zone.includes('bay 2') && !zone.includes('bay 4')) ||
          (bNumber === 4 && item.category === 'meat' && !zone.includes('bay 1') && !zone.includes('bay 2') && !zone.includes('bay 3'));

        if (matchesPrev || matchesNum || matchesId || (matchesDefaultCategory && !previousName)) {
          return { ...item, coldRoomZone: updatedBay.name, lastUpdated: new Date().toISOString() };
        }
        return item;
      });
    }

    return res.json({
      success: true,
      bay: updatedBay,
      bays: freezerBays,
      inventory,
    });
  }
  res.status(400).json({ error: 'bay or bays required' });
});

// 4.05 ADD A Chamber (Freezer Bay)
app.post('/api/freezer-bays/add', (req, res) => {
  const newBay = req.body || {};
  const nextNum = freezerBays.length + 1;
  const createdBay = {
    id: newBay.id || `bay-${Date.now()}`,
    name: newBay.name || `Chamber ${nextNum} - Commercial Cold Expansion Bay`,
    nameTwi: newBay.nameTwi || `Chamber ${nextNum} - Bea Foforɔ`,
    tempCelsius: typeof newBay.tempCelsius === 'number' ? newBay.tempCelsius : -21.5,
    capacityCartons: typeof newBay.capacityCartons === 'number' ? newBay.capacityCartons : 700,
    powerSource: newBay.powerSource || 'Industrial 3-Phase ECG + 500kVA Auto Genset',
    status: newBay.status || 'Optimal Freezing',
    assignedCategory: newBay.assignedCategory || 'fish',
  };
  freezerBays.push(createdBay);
  res.json({ success: true, bay: createdBay, bays: freezerBays, inventory });
});

// 4.06 DELETE / DECOMMISSION A Chamber
app.post('/api/freezer-bays/delete', (req, res) => {
  const { id, reassignToBayId } = req.body;
  if (!id) return res.status(400).json({ error: 'Chamber ID is required' });
  if (freezerBays.length <= 1) {
    return res.status(400).json({ error: 'At least one cold chamber must remain active.' });
  }

  const targetBay = freezerBays.find(b => b.id === id);
  if (!targetBay) return res.status(404).json({ error: 'Chamber not found' });

  const fallbackBay = freezerBays.find(b => b.id !== id && (reassignToBayId ? b.id === reassignToBayId : true)) || freezerBays.find(b => b.id !== id);

  // Safely reassign any inventory items currently allocated to this chamber
  if (fallbackBay && targetBay) {
    inventory = inventory.map(item => {
      const zone = (item.coldRoomZone || '').toLowerCase();
      if (zone.includes(targetBay.name.toLowerCase()) || zone.includes(id.toLowerCase())) {
        return { ...item, coldRoomZone: fallbackBay.name, lastUpdated: new Date().toISOString() };
      }
      return item;
    });
  }

  freezerBays = freezerBays.filter(b => b.id !== id);
  res.json({ success: true, deletedId: id, reallocatedTo: fallbackBay?.name, bays: freezerBays, inventory });
});

// 4.07 DYNAMICALLY SET NUMBER OF CHAMBERS (Fleet Scale)
app.post('/api/freezer-bays/set-count', (req, res) => {
  const { count } = req.body;
  const targetCount = parseInt(count, 10);
  if (isNaN(targetCount) || targetCount < 1 || targetCount > 30) {
    return res.status(400).json({ error: 'Chamber count must be between 1 and 30' });
  }

  const currentCount = freezerBays.length;
  if (targetCount > currentCount) {
    // Expand fleet using realistic enterprise fisheries templates
    for (let i = currentCount + 1; i <= targetCount; i++) {
      const template = getChamberTemplate(i);
      freezerBays.push(template);
    }
  } else if (targetCount < currentCount) {
    // Shrink fleet safely: reallocate cartons from decommissioned chambers to remaining chambers
    const removedBays = freezerBays.slice(targetCount);
    freezerBays = freezerBays.slice(0, targetCount);
    const primaryBay = freezerBays[0];

    if (primaryBay) {
      const removedNames = removedBays.map(b => b.name.toLowerCase());
      inventory = inventory.map(item => {
        const zone = (item.coldRoomZone || '').toLowerCase();
        if (removedNames.some(rn => zone.includes(rn))) {
          return { ...item, coldRoomZone: primaryBay.name, lastUpdated: new Date().toISOString() };
        }
        return item;
      });
    }
  }

  res.json({ success: true, count: freezerBays.length, bays: freezerBays, inventory });
});

// 4.1 GET /api/stock/logbook - Timely Stock Keeping & End-of-Day Audit Log Book
app.get('/api/stock/logbook', (req, res) => {
  const persona = (req.query.persona as string) || 'akosua';
  const supervisorName = (req.query.supervisor as string) || 'Boss Isaac';
  const today = new Date().toISOString().split('T')[0];

  // Filter transactions belonging to today
  const todayTxs = transactions.filter(t => t.timestamp && t.timestamp.startsWith(today));
  
  let totalSoldToday = 0;
  let totalReceivedToday = 0;
  let totalDamagedToday = 0;
  let grossSalesGHS = 0;
  let cashSalesGHS = 0;
  let momoSalesGHS = 0;
  let bankTransferGHS = 0;

  todayTxs.forEach(t => {
    const custInfo = (t.customerOrSupplier || '').toLowerCase();
    if (t.type === 'sale') {
      const q = Math.abs(t.quantity);
      totalSoldToday += q;
      grossSalesGHS += t.totalValueGHS;
      if (custInfo.includes('momo') || custInfo.includes('mobile money')) {
        momoSalesGHS += t.totalValueGHS;
      } else if (custInfo.includes('bank') || custInfo.includes('transfer')) {
        bankTransferGHS += t.totalValueGHS;
      } else {
        cashSalesGHS += t.totalValueGHS;
      }
    } else if (t.type === 'restock') {
      totalReceivedToday += Math.abs(t.quantity);
    } else if (t.type === 'spoilage') {
      totalDamagedToday += Math.abs(t.quantity);
    }
  });

  // Calculate timely item-level movement
  const itemLedger = inventory.map(item => {
    const itemTxs = todayTxs.filter(t => t.itemId === item.id);
    const sold = itemTxs.filter(t => t.type === 'sale').reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const received = itemTxs.filter(t => t.type === 'restock').reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const damaged = itemTxs.filter(t => t.type === 'spoilage').reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const openingStock = Math.max(0, item.currentStock + sold + damaged - received);
    const closingStock = item.currentStock;
    const salesValueGHS = sold * item.unitSellingPrice;
    const lastTx = itemTxs[0];

    let status: 'optimal' | 'warning' | 'critical' = 'optimal';
    if (closingStock <= Math.floor(item.minThreshold / 2)) {
      status = 'critical';
    } else if (closingStock <= item.minThreshold) {
      status = 'warning';
    }

    return {
      itemId: item.id,
      itemName: item.name,
      localNameTwi: item.localNameTwi || '',
      category: item.category,
      coldRoomZone: item.coldRoomZone,
      openingStock,
      receivedStock: received,
      soldStock: sold,
      damagedStock: damaged,
      closingStock,
      unit: item.unit,
      unitSellingPrice: item.unitSellingPrice,
      unitCostPrice: item.unitCostPrice,
      salesValueGHS,
      lastMovementTime: lastTx ? new Date(lastTx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      lastMovementType: lastTx ? lastTx.type : undefined,
      lastMovementQty: lastTx ? Math.abs(lastTx.quantity) : undefined,
      status
    };
  });

  const totalCurrentStock = inventory.reduce((a, b) => a + b.currentStock, 0);
  const totalOpeningStock = itemLedger.reduce((a, b) => a + b.openingStock, 0);
  const totalValuationGHS = inventory.reduce((a, b) => a + (b.currentStock * b.unitSellingPrice), 0);

  // Hourly timeline
  const hourlyTimeline = todayTxs.map(t => {
    const timeStr = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let paymentMode = 'Cash';
    const c = (t.customerOrSupplier || '').toLowerCase();
    if (c.includes('momo') || c.includes('mobile money')) paymentMode = 'Mobile Money (MTN/Telecel)';
    else if (c.includes('bank')) paymentMode = 'Bank Transfer';

    return {
      id: t.id,
      time: timeStr,
      itemName: t.itemName,
      type: t.type,
      quantity: Math.abs(t.quantity),
      unit: t.unit,
      amountGHS: t.totalValueGHS,
      paymentMode: t.type === 'sale' ? paymentMode : undefined,
      party: t.customerOrSupplier || (t.type === 'restock' ? 'Tema Cold Van Consignment' : 'Walk-in Customer')
    };
  });

  const lowStockItems = inventory.filter(i => i.currentStock <= i.minThreshold);
  const lowStockAlerts = lowStockItems.map(i =>
    `${i.name}: ${i.currentStock} ${i.unit} remaining (Re-order threshold: ${i.minThreshold}) in ${i.coldRoomZone}`
  );

  const isIsaac = persona === 'isaac' || persona === 'gdzigbodi';
  const stockkeeperNotes = isIsaac
    ? `Verified daily closing audit report for Paradise Fisheries submitted to ${supervisorName}. All ${freezerBays.length} industrial cold chambers inspected and operating at steady temperatures (-18°C to -30°C). Total facility inventory stands at ${totalCurrentStock} cartons. Today's gross sales reached GH₵ ${grossSalesGHS.toLocaleString()} across ${totalSoldToday} cartons. Re-order thresholds flagged for critical buffer items. Operations logged by Isaac (Cold Store Auditor & Manager).`
    : `Verified daily closing report for Paradise Fisheries submitted to ${supervisorName}. Compressor seals, refrigeration coils, and stock ledgers verified across all ${freezerBays.length} cold chambers. Total stock in chambers is ${totalCurrentStock} cartons. Today's gross revenue stands at GH₵ ${grossSalesGHS.toLocaleString()} with ${totalSoldToday} cartons sold. Low-stock replenishment notifications generated. Operations logged by Kwame (Lead Operations Stockkeeper).`;

  const report = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    storeName: 'Paradise Fisheries',
    location: 'Tema Fishing Harbour & Commercial Cold Hub, Greater Accra',
    dutyOfficer: isIsaac ? 'Isaac (Cold Store Auditor & Manager)' : 'Kwame (Lead Operations Stockkeeper)',
    dutyPersona: isIsaac ? 'isaac' : 'kwame',
    supervisorName,
    shiftPeriod: 'Full Day Closing & Final Ledger Balancing',
    metrics: {
      openingCartons: totalOpeningStock,
      closingCartons: totalCurrentStock,
      cartonsSold: totalSoldToday,
      cartonsReceived: totalReceivedToday,
      cartonsDamaged: totalDamagedToday,
      grossSalesGHS,
      cashSalesGHS,
      momoSalesGHS,
      bankTransferGHS,
      netValuationGHS: totalValuationGHS
    },
    itemLedger,
    hourlyTimeline,
    freezerTemperatures: freezerBays.map((b, i) => ({
      bay: `Chamber ${i + 1}`,
      zoneName: b.name,
      tempCelsius: b.tempCelsius,
      status: b.status.toLowerCase().includes('warning') ? ('warning' as const) : ('optimal' as const),
      notes: `${b.name} (${b.capacityCartons} ctns max, ${b.powerSource})`
    })),
    lowStockAlerts,
    stockkeeperNotes,
    officialSealNumber: `PF-AUDIT-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`
  };

  res.json({ success: true, report });
});

// Helper: Retry logic for transient Gemini errors (503 high demand, 429 rate limit)
async function callWithRetry<T>(
  operation: () => Promise<T>,
  retries = 1,
  baseDelayMs = 600
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err: any) {
      attempt++;
      const errMsg = String(err?.message || '');
      const errStatus = err?.status || err?.error?.code;
      const isTransient =
        errStatus === 503 ||
        errStatus === 429 ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('try again later');

      if (isTransient && attempt <= retries) {
        const delay = baseDelayMs * attempt;
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
}

// Resilient audio transcription using Gemini 3.5 Transcribe with automatic fallback
async function transcribeAudio(ai: GoogleGenAI, audioBase64: string, mimeType?: string): Promise<string | null> {
  let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim();
  if (!cleanMime.startsWith('audio/')) {
    cleanMime = 'audio/webm';
  }

  const audioPart = {
    inlineData: {
      mimeType: cleanMime,
      data: audioBase64,
    },
  };

  const promptText = 'Transcribe what the speaker is saying verbatim. The speaker is a Ghanaian cold store owner and might be speaking Ghanaian English, Asante Twi, Akuapem Twi, or a mix of both. Return ONLY the transcribed words with no extra commentary.';

  // Attempt 1: gemini-3.5-transcribe
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, { text: promptText }] },
    });
    const transcript = res.text?.trim();
    if (transcript) return transcript;
  } catch (_err1) {
    // Model busy, fallback smoothly
  }

  // Attempt 2: gemini-flash-latest
  try {
    const res2 = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: { parts: [audioPart, { text: promptText }] },
    });
    const transcript = res2.text?.trim();
    if (transcript) return transcript;
  } catch (_err2) {
    // Model busy, fallback smoothly
  }

  // Attempt 3: gemini-3.1-flash-lite
  try {
    const res3 = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: [audioPart, { text: promptText }] },
    });
    return res3.text?.trim() || null;
  } catch (_err3) {
    return null;
  }
}

// Helper: TTS Audio synthesis with non-blocking timeout guard & persona voice selection
async function generateTTSAudio(
  ai: GoogleGenAI | null,
  text: string,
  voicePersona: 'kwame' | 'isaac' | 'gameli' | 'gdzigbodi' | 'kofi' | 'akosua' = 'kwame'
): Promise<string | null> {
  if (!ai || !text) return null;
  try {
    const isKwame = voicePersona === 'kwame' || voicePersona === 'gameli' || voicePersona === 'kofi';
    const voiceName = isKwame ? 'Puck' : 'Charon'; // Puck = resonant firm male (Kwame); Charon = articulate executive tone (Isaac)
    const personaInstruction = `Speak clearly, authoritatively, and directly in English for Paradise Fisheries cold store with no fluttering words. Speak straight to the point: ${text}`;

    const ttsCall = ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: personaInstruction }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const timeoutGuard = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
    const response: any = await Promise.race([ttsCall, timeoutGuard]);
    if (!response) return null;
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (_err) {
    // TTS preview model busy or rate-limited; gracefully return null to let browser TTS handle speech
    return null;
  }
}

// Built-in Ghanaian Cold Store Semantic Engine (Delegates to modular multi-sale & multi-instruction engine)
function parseWithRuleBasedColdStoreEngine(
  rawText: string,
  fallbackNotice?: string,
  voicePersona: "kwame" | "isaac" | "gameli" | "gdzigbodi" | "kofi" | "akosua" = "kwame",
  adminName = "Mama Gloria",
  pendingContext?: any
) {
  return runColdStoreEngine(rawText, fallbackNotice, voicePersona, adminName, pendingContext, inventory, transactions, freezerBays);
}

// 4.5 AI Voice Greeting (English conversational voice-over with Kwame & Isaac personas)
app.post('/api/voice/greeting', async (req, res) => {
  try {
    const { adminName = 'Mama Gloria', voicePersona = 'kwame' } = req.body;
    const ai = getGenAI();
    const isIsaac = voicePersona === 'isaac' || voicePersona === 'gdzigbodi';

    const greetingEn = isIsaac
      ? `Stockkeeper Isaac ready for Paradise Fisheries. ${freezerBays.length} cold chambers operational. State your sale, delivery, or stock check, ${adminName}.`
      : `Stockkeeper Kwame ready for Paradise Fisheries. ${freezerBays.length} cold chambers operational. State your sale, delivery, or stock check, ${adminName}.`;

    const speechText = greetingEn;
    const audioBase64 = await generateTTSAudio(ai, speechText, voicePersona);

    res.json({
      success: true,
      voicePersona,
      greetingEn,
      greetingTwi: greetingEn,
      audioBase64,
      pendingContext: {
        questionType: 'NEXT_ACTION',
        lastIntent: 'GENERAL_TALK',
        questionTextEn: greetingEn,
        questionTextTwi: greetingEn,
        suggestedAnswers: [
          '💰 Sold 10 cartons of Tilapia',
          '🚚 Received 25 cartons of Titus Mackerel',
          '📊 Generate Daily Log Book Report',
          '📦 Check Yellowfin Tuna stock in Chamber 4',
        ]
      },
      suggestedQuickReplies: [
        '💰 Sold 10 cartons of Tilapia',
        '🚚 Received 25 cartons of Titus Mackerel',
        '📊 Generate Daily Log Book Report',
        '📦 Check Yellowfin Tuna stock in Chamber 4',
      ],
    });
  } catch (_err) {
    res.json({
      success: true,
      greetingEn: `Paradise Fisheries stockkeeper ready. ${freezerBays.length} cold chambers operational. State your sale, delivery, or stock check.`,
      greetingTwi: `Paradise Fisheries stockkeeper ready. ${freezerBays.length} cold chambers operational. State your sale, delivery, or stock check.`,
      audioBase64: null,
      pendingContext: {
        questionType: 'NEXT_ACTION',
        lastIntent: 'GENERAL_TALK',
        questionTextEn: 'State your cold store transaction, Mama Gloria.',
        questionTextTwi: 'State your cold store transaction, Mama Gloria.'
      },
      suggestedQuickReplies: ['💰 Record a Sale', '🚚 Receive Delivery', '📊 Generate Daily Log Book', '📦 Check Stock Levels'],
    });
  }
});

// 5. AI Voice / Text Processing (English + Twi with Interactive Questions)
app.post('/api/voice/process', async (req, res) => {
  try {
    const {
      transcript,
      audioBase64,
      mimeType,
      preferredLanguage,
      adminName = 'Mama Gloria',
      conversationHistory = [],
      voicePersona = 'kwame',
      pendingContext = null
    } = req.body;
    let textToProcess = (transcript || '').trim();

    const ai = getGenAI();

    // If audio was provided without transcript, use Gemini to transcribe first
    if (!textToProcess && audioBase64 && ai) {
      const transcribed = await transcribeAudio(ai, audioBase64, mimeType);
      if (transcribed) {
        textToProcess = transcribed.trim();
      }
    }

    // Gracefully handle empty voice/text without throwing 400 error
    if (!textToProcess) {
      return res.status(200).json({
        success: false,
        emptyInput: true,
        detectedLanguage: preferredLanguage === 'tw' ? 'Twi' : 'English',
        rawTranscript: '',
        intent: 'GENERAL_TALK',
        voicePersona,
        itemsAffected: [],
        pendingContext: pendingContext || {
          questionType: 'NEXT_ACTION',
          lastIntent: 'GENERAL_TALK'
        },
        replyTextEn: `No speech detected. State your transaction or stock query.`,
        replyTextTwi: `No speech detected. State your transaction or stock query.`,
        followUpQuestionEn: `Record a sale, restock, or check stock?`,
        followUpQuestionTwi: `Record a sale, restock, or check stock?`,
        suggestedQuickReplies: ['💰 Record a Sale', '🚚 Receive Delivery', '📦 Check Stock Levels'],
        lowStockWarnings: [],
        summaryGHS: 0,
        updatedInventory: inventory,
        notice: 'No speech detected. Speak clearly into the microphone.'
      });
    }

    // Prepare current inventory summary for Gemini context
    const currentInventorySummary = inventory.map(item => ({
      id: item.id,
      name: item.name,
      localNameTwi: item.localNameTwi,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      unitSellingPriceGHS: item.unitSellingPrice,
      coldRoomZone: item.coldRoomZone
    }));

    // If Gemini API is not configured, immediately use resilient rule engine
    if (!ai) {
      const fallbackResult = parseWithRuleBasedColdStoreEngine(textToProcess, undefined, voicePersona, adminName, pendingContext);
      return res.json(fallbackResult);
    }

    // Persona-specific role definition
    const isIsaac = voicePersona === 'isaac' || voicePersona === 'gdzigbodi';
    const personaTitle = isIsaac
      ? 'Isaac — Senior Cold Store Auditor & Inventory Manager for Paradise Fisheries'
      : 'Kwame — Lead Operations Stockkeeper & Cold Bays Supervisor for Paradise Fisheries';

    // Attempt Gemini Processing with Automatic Retry & Model Fallbacks
    const systemPrompt = `You are "${personaTitle}" for Paradise Fisheries in Ghana.
The company is a large commercial fisheries enterprise operating a fleet of ${freezerBays.length} cold chambers, selling frozen fish (tilapia, mackerel/titus, red fish, salmon, tuna loins, red snapper, grouper, crustaceans/shrimps), meats (boneless beef, pork chops), poultry (chicken thighs, gizzard, turkey wings, turkey tail/chofi), sausages (frankfurters, beef sausage), and cold store inventory.
You are speaking directly to ${adminName} (Executive Leadership of Paradise Fisheries).

PERSONA ARCHETYPE:
${!isIsaac ? `
- KWAME: Lead Operations Stockkeeper. Dependable, vigilant cold room floor supervisor. Practical, firm, direct, and focused on chamber floor inventory counts, container offload tallies, and physical freezer bays.
` : `
- ISAAC: Senior Cold Store Auditor & Manager. Razor-sharp, executive, articulate, financially astute, and vigilant with commercial margins and ledger balance. You know all numbers, unit margins, and inventory positions offhand. You execute instructions with crisp accuracy and prompt professional delivery.
`}

CRITICAL DIRECTIVES (STRICTLY ENFORCED):
1. STRICT ADHERENCE TO USER INSTRUCTIONS:
   - Carefully transcribe and parse what ${adminName} is saying and go by every instruction with precision.
   - If ${adminName} specifies an exact quantity, product, customer name, price, or cold bay, carry out that exact instruction without substituting or altering.
   - If a customer is mentioned (e.g. "to Sister Mary", "to Auntie Julie", "to Mr Mensah"), capture the customer name in customerOrSupplier.
   - If a supplier is mentioned (e.g. "from Golden Poultry", "from Pioneer Food"), record the supplier name in customerOrSupplier.
   - For sales: deduct exact quantity from stock, compute exact GHS amount (quantity * unitSellingPrice), and state the updated remaining stock in that freezer bay.
   - For restocks: add exact quantity, state the supplier if given, and confirm the new total stock.
   - For queries: state exact unit price or carton stock immediately.

2. SMART, PROFESSIONAL & DIRECT — NO FLUTTERING WORDS:
   - Absolutely NO fluttering words, NO romantic nicknames (NEVER say "my love", "sweetheart", "darling", "dearest", "handsome", etc.).
   - Absolutely NO servile or excessively polite flattery.
   - Speak in crisp, executive, professional business English.
   - Keep answers mathematically and factually precise.
   - Keep follow-up questions short and direct (e.g. "Payment: Cash or MoMo?", "Add more items or close?", "Next transaction?").

3. ENGLISH ONLY:
   - Speak only in clear, concise English. Set both replyTextEn and replyTextTwi to English.

4. ACTIVE PENDING QUESTION CONTEXT & CONTINUITY:
Active Pending Question Context from previous turn:
${pendingContext ? JSON.stringify(pendingContext, null, 2) : 'None. Starting a new interaction.'}

- If the user's input is a response to a pending question (e.g., "Cash", "MoMo", "Yes add 5 chicken thighs", "No that is all", "Generate report", "Show log book"):
  * If PAYMENT_METHOD: Record payment method (Cash / Mobile Money). Ask directly: "Add more items or close receipt?"
  * If ADDITIONAL_ITEMS: If boss says no or that's all, conclude receipt and give total GHS revenue. If items added, add them to sale.
  * If boss says "generate report", "daily log book", "closing report" -> Set intent to 'GENERATE_LOGBOOK' and confirm report is compiled in Log Book tab.

5. MULTIPLE SALES & MULTIPLE INSTRUCTIONS IN A SINGLE VOICE COMMAND:
   - If the user commands multiple sales in one instruction (e.g., "Sold 10 cartons of Tilapia, 5 cartons of Red Fish, and 8 cartons of Chicken Wings"):
     * Return ALL items in the itemsAffected array.
     * For each item, set action: 'deduct', accurate quantity, item ID, item name, unit price, and total amount.
     * Set intent: 'MULTIPLE_INSTRUCTIONS'.
     * In replyTextEn, clearly confirm each sale with product name, quantity, line total, and updated freezer bay balance, along with the total aggregate revenue.
   - If the user issues multiple mixed instructions (e.g., "Sold 10 cartons of Tilapia to Sister Akua for cash, and restock 20 cartons of Turkey Wings from Pioneer Food"):
     * Add both the sale (action: 'deduct') and restock (action: 'add') into itemsAffected.
     * Set intent: 'MULTIPLE_INSTRUCTIONS'.
     * In replyTextEn, summarize each executed instruction sequentially.

6. SHORT FOLLOW-UP QUESTIONS & SUGGESTIONS:
   - Follow-up question must be 1 short direct sentence.
   - Provide 3-4 direct suggestions in suggestedQuickReplies.

Recent Conversation Context:
${JSON.stringify(conversationHistory.slice(-4), null, 2)}

Current Cold Store Inventory:
${JSON.stringify(currentInventorySummary, null, 2)}`;

    const modelSchema = {
      type: Type.OBJECT,
      properties: {
        detectedLanguage: { type: Type.STRING, enum: ['English', 'Mixed'] },
        intent: { type: Type.STRING, enum: ['SALE', 'RESTOCK', 'QUERY_STOCK', 'QUERY_PRICE', 'SPOILAGE', 'GENERATE_LOGBOOK', 'BUSINESS_ADVICE', 'GENERAL_TALK', 'MULTIPLE_INSTRUCTIONS'] },
        itemsAffected: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemId: { type: Type.STRING },
              itemName: { type: Type.STRING },
              action: { type: Type.STRING, enum: ['deduct', 'add', 'query', 'report'] },
              quantity: { type: Type.INTEGER },
              unit: { type: Type.STRING },
              unitPrice: { type: Type.NUMBER },
              totalAmountGHS: { type: Type.NUMBER },
              customerOrSupplier: { type: Type.STRING },
              paymentMethod: { type: Type.STRING },
            },
            required: ['itemId', 'itemName', 'action', 'quantity', 'unit', 'unitPrice', 'totalAmountGHS']
          }
        },
        replyTextEn: { type: Type.STRING },
        replyTextTwi: { type: Type.STRING },
        followUpQuestionEn: { type: Type.STRING },
        followUpQuestionTwi: { type: Type.STRING },
        suggestedQuickReplies: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        lowStockWarnings: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        pendingContext: {
          type: Type.OBJECT,
          properties: {
            questionType: { type: Type.STRING, enum: ['PAYMENT_METHOD', 'ADDITIONAL_ITEMS', 'SUPPLIER_CHECK', 'TECHNICIAN_ALERT', 'CONFIRM_SALE', 'NEXT_ACTION', 'GENERAL'] },
            lastIntent: { type: Type.STRING },
            lastItemId: { type: Type.STRING },
            lastItemName: { type: Type.STRING },
            lastQuantity: { type: Type.INTEGER },
            orderRunningTotalGHS: { type: Type.NUMBER },
            questionTextEn: { type: Type.STRING },
            questionTextTwi: { type: Type.STRING },
            suggestedAnswers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['questionType']
        }
      },
      required: ['detectedLanguage', 'intent', 'itemsAffected', 'replyTextEn', 'replyTextTwi', 'followUpQuestionEn', 'followUpQuestionTwi', 'suggestedQuickReplies']
    };

    let geminiRawText = '';

    // Fast AI query with 3500ms safety timeout to handle multi-instruction reasoning
    try {
      const callGemini = async () => {
        try {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Voice Input from ${adminName}: "${textToProcess}"`,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              responseSchema: modelSchema,
            }
          });
        } catch {
          return await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: `Voice Input from ${adminName}: "${textToProcess}"`,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              responseSchema: modelSchema,
            }
          });
        }
      };

      const geminiRes: any = await Promise.race([
        callGemini(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT_EXCEEDED')), 3500))
      ]);
      geminiRawText = geminiRes?.text || '';
    } catch (_aiErr) {
      // Safe instantaneous failover to resilient cold store engine (<5ms)
      const fallbackResult = parseWithRuleBasedColdStoreEngine(
        textToProcess,
        'Answered instantly via Paradise Fisheries cold store engine.',
        voicePersona,
        adminName,
        pendingContext
      );
      return res.json(fallbackResult);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(geminiRawText);
    } catch (_parseErr) {
      const fallbackResult = parseWithRuleBasedColdStoreEngine(textToProcess, undefined, voicePersona, adminName, pendingContext);
      return res.json(fallbackResult);
    }

    const itemsAffectedWithStock: any[] = [];
    let summaryGHS = 0;

    // Apply inventory updates
    if (Array.isArray(parsed.itemsAffected)) {
      for (const affected of parsed.itemsAffected) {
        const item = inventory.find(i => i.id === affected.itemId) || 
                     inventory.find(i => i.name.toLowerCase().includes(affected.itemName.toLowerCase())) ||
                     inventory[0];
        
        const prevStock = item.currentStock;
        let newStock = prevStock;

        if (affected.action === 'deduct') {
          newStock = Math.max(0, prevStock - Math.abs(affected.quantity));
          item.currentStock = newStock;
          item.lastUpdated = new Date().toISOString();
          summaryGHS += (affected.totalAmountGHS || (Math.abs(affected.quantity) * item.unitSellingPrice));

          // Log transaction
          const isSpoilage = parsed.intent === 'SPOILAGE';
          const customerStr = affected.customerOrSupplier || (isSpoilage ? 'Damaged in Cold Store' : (affected.paymentMethod ? `Walk-in Customer (Paid via ${affected.paymentMethod})` : 'Walk-in / Wholesale Customer'));
          const tx: TransactionRecord = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toISOString(),
            type: isSpoilage ? 'spoilage' : 'sale',
            itemId: item.id,
            itemName: item.name,
            quantity: -Math.abs(affected.quantity),
            unit: item.unit,
            unitPrice: item.unitSellingPrice,
            totalValueGHS: Math.abs(affected.quantity) * item.unitSellingPrice,
            customerOrSupplier: customerStr,
            paymentMethod: affected.paymentMethod,
            voiceTranscript: textToProcess,
            detectedLanguage: parsed.detectedLanguage,
            aiResponseEn: parsed.replyTextEn,
            aiResponseTwi: parsed.replyTextTwi
          };
          transactions.unshift(tx);

        } else if (affected.action === 'add') {
          newStock = prevStock + Math.abs(affected.quantity);
          item.currentStock = newStock;
          item.lastUpdated = new Date().toISOString();

          const supplierStr = affected.customerOrSupplier || 'Cold Store Restock Shipment';
          const tx: TransactionRecord = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toISOString(),
            type: 'restock',
            itemId: item.id,
            itemName: item.name,
            quantity: Math.abs(affected.quantity),
            unit: item.unit,
            unitPrice: item.unitCostPrice,
            totalValueGHS: Math.abs(affected.quantity) * item.unitCostPrice,
            customerOrSupplier: supplierStr,
            voiceTranscript: textToProcess,
            detectedLanguage: parsed.detectedLanguage,
            aiResponseEn: parsed.replyTextEn,
            aiResponseTwi: parsed.replyTextTwi
          };
          transactions.unshift(tx);
        }

        itemsAffectedWithStock.push({
          ...affected,
          itemId: item.id,
          itemName: item.name,
          previousStock: prevStock,
          newStock: newStock
        });
      }
    }

    // Determine pendingContext fallback if Gemini didn't supply one
    let resolvedPendingContext = parsed.pendingContext;
    if (!resolvedPendingContext) {
      if (parsed.intent === 'SALE') {
        resolvedPendingContext = {
          questionType: 'PAYMENT_METHOD',
          lastIntent: 'SALE',
          orderRunningTotalGHS: summaryGHS,
          questionTextEn: parsed.followUpQuestionEn,
          questionTextTwi: parsed.followUpQuestionTwi,
          suggestedAnswers: parsed.suggestedQuickReplies
        };
      } else if (parsed.intent === 'RESTOCK') {
        resolvedPendingContext = {
          questionType: 'SUPPLIER_CHECK',
          lastIntent: 'RESTOCK',
          questionTextEn: parsed.followUpQuestionEn,
          questionTextTwi: parsed.followUpQuestionTwi,
          suggestedAnswers: parsed.suggestedQuickReplies
        };
      } else {
        resolvedPendingContext = {
          questionType: 'NEXT_ACTION',
          lastIntent: parsed.intent,
          questionTextEn: parsed.followUpQuestionEn,
          questionTextTwi: parsed.followUpQuestionTwi,
          suggestedAnswers: parsed.suggestedQuickReplies
        };
      }
    }

    // Generate immediate spoken voice-over for faster interactive conversational response
    const speechTextToVoice = preferredLanguage === 'tw'
      ? `${parsed.replyTextTwi} ${parsed.followUpQuestionTwi || ''}`
      : `${parsed.replyTextEn} ${parsed.followUpQuestionEn || ''}`;
    
    // Client speaks immediately with zero-lag browser Web Speech API
    const synthesizedAudioBase64: string | null = null;

    res.json({
      success: true,
      detectedLanguage: parsed.detectedLanguage || 'English',
      rawTranscript: textToProcess,
      intent: parsed.intent || 'GENERAL_TALK',
      voicePersona,
      pendingContext: resolvedPendingContext,
      itemsAffected: itemsAffectedWithStock,
      replyTextEn: parsed.replyTextEn,
      replyTextTwi: parsed.replyTextTwi,
      followUpQuestionEn: parsed.followUpQuestionEn,
      followUpQuestionTwi: parsed.followUpQuestionTwi,
      suggestedQuickReplies: parsed.suggestedQuickReplies || ['💰 Record a Sale', '🚚 Receive Delivery', '📦 Check Stock'],
      audioBase64: synthesizedAudioBase64,
      lowStockWarnings: parsed.lowStockWarnings || [],
      summaryGHS,
      updatedInventory: inventory,
      transactions: transactions,
    });

  } catch (_err: any) {
    const fallbackText = (req.body?.transcript || '').trim();
    const fallbackPersona = req.body?.voicePersona || 'kofi';
    const fallbackAdmin = req.body?.adminName || 'Boss Isaac';
    const fallbackPendingContext = req.body?.pendingContext || null;
    if (fallbackText) {
      const fallbackResult = parseWithRuleBasedColdStoreEngine(fallbackText, 'Processed via safe backup stockkeeper engine.', fallbackPersona, fallbackAdmin, fallbackPendingContext);
      return res.json(fallbackResult);
    }
    res.status(200).json({
      success: false,
      emptyInput: true,
      replyTextEn: `Please Boss ${fallbackAdmin}, I had a brief audio interruption. Please speak again or tap any quick action below.`,
      replyTextTwi: `Please Boss ${fallbackAdmin}, I had a brief audio interruption. Please speak again or tap any quick action below.`,
      followUpQuestionEn: 'What would you like us to attend to next, Boss?',
      followUpQuestionTwi: 'What would you like us to attend to next, Boss?',
      suggestedQuickReplies: ['💰 Record a Sale', '🚚 Receive Delivery', '📦 Check Stock Levels'],
      detectedLanguage: 'English',
      intent: 'GENERAL_TALK',
      voicePersona: fallbackPersona,
      pendingContext: {
        questionType: 'NEXT_ACTION',
        lastIntent: 'GENERAL_TALK'
      },
      itemsAffected: [],
      rawTranscript: '',
      updatedInventory: inventory,
      notice: 'Temporary service interruption handled safely.'
    });
  }
});

// 6. AI Speech Talk (TTS with Ghanaian Kofi & Akosua personas)
app.post('/api/voice/speak', async (req, res) => {
  try {
    const { text, language, voicePersona = 'kofi' } = req.body;
    if (!text) {
      return res.status(200).json({ audioBase64: null });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({ audioBase64: null, message: 'Gemini API key not configured, use client speech' });
    }

    try {
      const audioBase64 = await generateTTSAudio(ai, text, voicePersona);
      return res.json({ audioBase64, sampleRate: 24000, voicePersona });
    } catch (_ttsErr) {
      return res.json({ audioBase64: null });
    }
  } catch (_err: any) {
    res.json({ audioBase64: null });
  }
});

// Start Server and mount Vite
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cold Store AI Stockkeeper Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
