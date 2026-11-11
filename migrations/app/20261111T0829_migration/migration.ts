#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2a107e6dcdda2dfd9d497d44608d2713fd7bdf2ceee34d2d40c1d0b4fa3817f9/contract';
import startContract from '../../snapshots/2a107e6dcdda2dfd9d497d44608d2713fd7bdf2ceee34d2d40c1d0b4fa3817f9/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/631269c12f2f0130d4c56bb8d79c66ebf0cf174cf4b6a566ee9646d4217f25bb/contract';
import endContract from '../../snapshots/631269c12f2f0130d4c56bb8d79c66ebf0cf174cf4b6a566ee9646d4217f25bb/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'User', column: 'id' }),
      this.createTable({
        schema: 'public',
        table: 'user_identities',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('subject', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.setDefault({
        schema: 'public',
        table: 'User',
        column: col('emailVerified', 'bool', {
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'User',
        column: 'id',
        type: 'text',
        operationClass: 'widening',
      }),
      this.dropNotNull({ schema: 'public', table: 'User', column: 'passwordHash' }),
      this.addUnique({
        schema: 'public',
        table: 'user_identities',
        constraint: 'user_identities_provider_key',
        columns: ['provider'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user_identities',
        constraint: 'user_identities_subject_key',
        columns: ['subject'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user_identities',
        constraint: 'user_identities_provider_subject_key',
        columns: ['provider', 'subject'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'user_identities',
        index: 'user_identities_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'user_identities',
        foreignKey: {
          name: 'user_identities_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'User', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
