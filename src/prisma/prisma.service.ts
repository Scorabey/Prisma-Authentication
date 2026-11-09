import { Injectable } from "@nestjs/common";
import { db } from './db.ts'

@Injectable()
export class PrismaService {
  readonly db = db;
}
