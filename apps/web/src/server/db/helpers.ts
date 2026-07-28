import type { Prisma } from '@prisma/client';
import prisma from './client';

export type TxClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function transaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn);
}
