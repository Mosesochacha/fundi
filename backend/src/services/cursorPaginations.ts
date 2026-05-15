import { Op } from 'sequelize';
import logger from '../utils/logger';
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64');
}

export function decodeCursor(cursor: string) {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  const [createdAt, id] = decoded.split('|');
  if (!createdAt || !id) {
    logger.error('Invalid cursor format', { cursor });
    throw new Error('Invalid cursor format');
  }
  return {
    createdAt: new Date(createdAt),
    id,
  };
}

export function buildCursorWhere(cursor?: string) {
  if (!cursor) return {};

  const { createdAt, id } = decodeCursor(cursor);
  if (!createdAt || !id) {
    logger.error('Invalid cursor format', { cursor });
    throw new Error('Invalid cursor format');
  }
  return {
    [Op.or]: [
      { createdAt: { [Op.lt]: createdAt } },
      {
        createdAt,
        id: { [Op.lt]: id },
      },
    ],
  };
}
