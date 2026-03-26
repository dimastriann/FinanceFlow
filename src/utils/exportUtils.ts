import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import { utils, write } from 'xlsx';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ExportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const getPeriodRange = (type: ExportType) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (type) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start: start.getTime(), end: end.getTime() };
};

const saveFile = async (
  fileUri: string,
  fileName: string,
  mimeType: string
) => {
  if (Platform.OS === 'android') {
    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (permissions.granted) {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const uri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        mimeType
      );
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return uri;
    }
  }

  // Fallback for iOS or if Android permission denied
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
    return fileUri;
  }
  throw new Error('Saving/Sharing not available');
};

export const exportReport = async (type: ExportType, format: ExportFormat) => {
  const { start, end } = getPeriodRange(type);

  const expenses = await db
    .select()
    .from(schema.expenses)
    .where(
      and(gte(schema.expenses.date, start), lte(schema.expenses.date, end))
    );

  if (expenses.length === 0) {
    throw new Error('No data found for the selected period.');
  }

  const categories = await db.select().from(schema.categories);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const data = expenses.map((e) => ({
    Date: new Date(e.date).toLocaleDateString(),
    Merchant: e.merchant,
    Category: categoryMap.get(e.categoryId) || 'Unknown',
    Amount: e.amount,
    Note: e.note || '',
  }));

  const fileName = `FinanceFlow_Report_${type}_${new Date().getTime()}`;
  let fileUri = '';
  let mimeType = '';

  if (format === 'csv') {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    fileUri = `${FileSystem.cacheDirectory}${fileName}.csv`;
    mimeType = 'text/csv';
    await FileSystem.writeAsStringAsync(fileUri, csvContent);
  } else if (format === 'xlsx') {
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Expenses');
    const wbout = write(wb, { type: 'base64', bookType: 'xlsx' });
    fileUri = `${FileSystem.cacheDirectory}${fileName}.xlsx`;
    mimeType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else if (format === 'pdf') {
    const total = data.reduce((sum, row) => sum + row.Amount, 0);
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            h1 { color: #007AFF; margin-bottom: 5px; }
            h2 { color: #666; font-size: 16px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #F2F2F7; text-align: left; padding: 12px; border-bottom: 2px solid #DDD; }
            td { padding: 12px; border-bottom: 1px solid #EEE; }
            .total { margin-top: 30px; text-align: right; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Financial Report</h1>
          <h2>Period: ${type.charAt(0).toUpperCase() + type.slice(1)} (${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()})</h2>
          <table>
            <thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th></tr></thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr><td>${row.Date}</td><td>${row.Merchant}</td><td>${row.Category}</td><td>$${row.Amount.toFixed(2)}</td></tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="total">Total: $${total.toFixed(2)}</div>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    fileUri = uri;
    mimeType = 'application/pdf';
  }

  await saveFile(fileUri, fileName, mimeType);
};

export const backupData = async () => {
  const [expenses, categories, budgets, settings, budgetLogs] =
    await Promise.all([
      db.select().from(schema.expenses),
      db.select().from(schema.categories),
      db.select().from(schema.budgets),
      db.select().from(schema.userSettings),
      db.select().from(schema.budgetLogs),
    ]);

  const backup = {
    version: 1,
    timestamp: Date.now(),
    data: { expenses, categories, budgets, settings, budgetLogs },
  };

  const fileName = `FinanceFlow_Backup_${new Date().getTime()}.json`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup));

  await saveFile(fileUri, fileName, 'application/json');
};

export const restoreData = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return false;

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri);
  const backup = JSON.parse(content);

  if (!backup.data || !backup.version) {
    throw new Error('Invalid backup file');
  }

  await db.transaction(async (tx) => {
    await tx.delete(schema.expenses);
    await tx.delete(schema.categories);
    await tx.delete(schema.budgets);
    await tx.delete(schema.userSettings);
    await tx.delete(schema.budgetLogs);

    if (backup.data.categories.length > 0)
      await tx.insert(schema.categories).values(backup.data.categories);
    if (backup.data.expenses.length > 0)
      await tx.insert(schema.expenses).values(backup.data.expenses);
    if (backup.data.budgets.length > 0)
      await tx.insert(schema.budgets).values(backup.data.budgets);
    if (backup.data.settings.length > 0)
      await tx.insert(schema.userSettings).values(backup.data.settings);
    if (backup.data.budgetLogs.length > 0)
      await tx.insert(schema.budgetLogs).values(backup.data.budgetLogs);
  });

  return true;
};
