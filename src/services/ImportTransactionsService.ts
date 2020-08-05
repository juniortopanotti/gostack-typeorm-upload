import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';

import CreateTransactionService from './CreateTransactionService';

interface Request {
  fileName: string;
}

interface CSVTransaction {
  type: 'income' | 'outcome';
  value: number;
  category: string;
  title: string;
}
class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const createTransactionService = new CreateTransactionService();
    const csvFilePath = path.resolve(uploadConfig.directory, fileName);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];

    await parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const persistedTransactions: Transaction[] = [];

    for (const transaction of transactions) {
      persistedTransactions.push(
        await createTransactionService.execute({ ...transaction }),
      );
    }

    return persistedTransactions;
  }
}

export default ImportTransactionsService;
