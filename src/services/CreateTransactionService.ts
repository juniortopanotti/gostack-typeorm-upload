import { getRepository, getCustomRepository } from 'typeorm';
// import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError("You don't have sufficient funds.", 400);
    }

    let categoryObject = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryObject) {
      categoryObject = await categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(categoryObject);
    }

    const transaction = await transactionRepository.create({
      title,
      value,
      type,
      category: categoryObject,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
