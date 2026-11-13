#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2a107e6dcdda2dfd9d497d44608d2713fd7bdf2ceee34d2d40c1d0b4fa3817f9/contract';
import startContract from '../../snapshots/2a107e6dcdda2dfd9d497d44608d2713fd7bdf2ceee34d2d40c1d0b4fa3817f9/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b1b92c7737f22e104d8980f0ffab3eec51264e508126bc7f45a49ea8a2fe30da/contract';
import endContract from '../../snapshots/b1b92c7737f22e104d8980f0ffab3eec51264e508126bc7f45a49ea8a2fe30da/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
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
        table: 'email_tokens',
        columns: [
          col('created_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expires_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('fingerprint', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('purpose', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'email_tokens_purpose_check_15049ca8',
            sql`"purpose" IN ('password-reset', 'email-verification')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'magic_links',
        columns: [
          col('created_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expires_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('redirect_to', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'mfa_authenticators',
        columns: [
          col('confirmed', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('last_used_step', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('pending_secret', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('secret', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['user_id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'mfa_failures',
        columns: [
          col('failed_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'mfa_recovery_codes',
        columns: [
          col('code_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['user_id', 'code_hash'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'oidc_logins',
        columns: [
          col('code_verifier', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('expires_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('link_session_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('link_user_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nonce', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('provider', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('redirect_to', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('state', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['state'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'refresh_tokens',
        columns: [
          col('claims', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('created_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('expires_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('family_expires_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('family_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revoked', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('used_at', 'timestamptz(6)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'sessions',
        columns: [
          col('created_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('expires_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('last_active_at', 'timestamptz(6)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 6 } },
          }),
          col('metadata', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('mfa', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('sessions_mfa_check_5d9599e1', sql`"mfa" IN ('pending', 'verified')`),
        ],
      }),
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
        table: 'email_tokens',
        index: 'email_tokens_expires_at_idx',
        columns: ['expires_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'email_tokens',
        index: 'email_tokens_user_id_purpose_idx',
        columns: ['user_id', 'purpose'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'magic_links',
        index: 'magic_links_expires_at_idx',
        columns: ['expires_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'mfa_failures',
        index: 'mfa_failures_failed_at_idx',
        columns: ['failed_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'mfa_failures',
        index: 'mfa_failures_user_id_failed_at_idx',
        columns: ['user_id', 'failed_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'oidc_logins',
        index: 'oidc_logins_expires_at_idx',
        columns: ['expires_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'refresh_tokens',
        index: 'refresh_tokens_family_expires_at_idx',
        columns: ['family_expires_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'refresh_tokens',
        index: 'refresh_tokens_family_id_idx',
        columns: ['family_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'refresh_tokens',
        index: 'refresh_tokens_user_id_idx',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sessions',
        index: 'sessions_expires_at_idx',
        columns: ['expires_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sessions',
        index: 'sessions_user_id_idx',
        columns: ['user_id'],
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
