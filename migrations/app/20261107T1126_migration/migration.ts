#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2a107e6dcdda2dfd9d497d44608d2713fd7bdf2ceee34d2d40c1d0b4fa3817f9/contract';
import startContract from '../../snapshots/2a107e6dcdda2dfd9d497d44608d2713fd7bdf2ceee34d2d40c1d0b4fa3817f9/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/2f2c2d9240d3d90c29f7aa0c085ad30b73ee8874a507a5d46ea0b5e7b8f82c31/contract';
import endContract from '../../snapshots/2f2c2d9240d3d90c29f7aa0c085ad30b73ee8874a507a5d46ea0b5e7b8f82c31/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'User', column: 'id' }),
      this.alterColumnType({
        schema: 'public',
        table: 'User',
        column: 'id',
        type: 'text',
        operationClass: 'widening',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
