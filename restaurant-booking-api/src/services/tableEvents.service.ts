import { Table } from '@prisma/client';
import { getSocket } from '../config/socket';

const getRoom = (branchId: string) => `branch:${branchId}`;

export class TableEvents {
  static tableUpdated(branchId: string, table: Table): void {
    const io = getSocket();
    io.to(getRoom(branchId)).emit('table.updated', table);
  }

  static tableRemoved(branchId: string, tableId: string): void {
    const io = getSocket();
    io.to(getRoom(branchId)).emit('table.removed', { tableId });
  }

  static layoutUpdated(branchId: string, tables: Table[]): void {
    const io = getSocket();
    io.to(getRoom(branchId)).emit('table.layout', tables);
  }
}
