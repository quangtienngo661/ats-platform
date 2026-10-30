import { Injectable } from '@nestjs/common';
import { Prisma } from '@ats-platform/database';
import { PrismaService } from '../prisma/prisma.service';
import { EMBEDDING_DIMENSIONS } from '../external-apis/embedding/embedding.service';

/**
 * Every table that holds a vector, with the column that identifies a row. Table and column
 * names cannot be SQL parameters, so they come ONLY from this constant map — a caller picks a
 * key, never a name. `interview_question` joins this map with its table in part 4.
 */
export const EMBEDDING_TARGETS = {
    skill: { table: 'skills', key: 'skill_id' },
    cv_parsed_data: { table: 'cv_parsed_data', key: 'id' },
} as const;

export type EmbeddingTarget = keyof typeof EMBEDDING_TARGETS;

/**
 * pgvector text form for a vector. Throws on a wrong dimension or a non-finite value, so a bad
 * embedding fails here in plain English instead of as an unreadable SQL error.
 */
export function toVectorLiteral(values: number[]): string {
    if (values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`A vector must have ${EMBEDDING_DIMENSIONS} values, got ${values.length}`);
    }
    if (!values.every(Number.isFinite)) {
        throw new Error('A vector must contain only finite numbers');
    }
    return `[${values.join(',')}]`;
}

@Injectable()
export class VectorSearchService {
    constructor(private readonly prisma: PrismaService) {}

    private target(target: EmbeddingTarget) {
        const entry = EMBEDDING_TARGETS[target];
        if (!entry) throw new Error(`Unknown embedding target: ${String(target)}`);
        return { table: Prisma.raw(`"${entry.table}"`), key: Prisma.raw(`"${entry.key}"`) };
    }

    /** Stores `vector` on one row. A row that no longer exists is not an error. */
    async writeEmbedding(target: EmbeddingTarget, id: string, vector: number[]): Promise<void> {
        const { table, key } = this.target(target);
        const literal = toVectorLiteral(vector);

        await this.prisma.$executeRaw(
            Prisma.sql`UPDATE ${table} SET "embedding" = ${literal}::vector WHERE ${key} = ${id}`,
        );
    }

    /** The stored vectors of `ids`. Rows with no embedding yet are left out. */
    async readEmbeddings(target: EmbeddingTarget, ids: string[]): Promise<Map<string, number[]>> {
        const { table, key } = this.target(target);
        const result = new Map<string, number[]>();
        if (ids.length === 0) return result;

        const rows = await this.prisma.$queryRaw<{ id: string; embedding: string }[]>(
            Prisma.sql`SELECT ${key} AS "id", "embedding"::text AS "embedding"
                       FROM ${table}
                       WHERE ${key} = ANY(${ids}::text[]) AND "embedding" IS NOT NULL`,
        );
        for (const row of rows) {
            result.set(row.id, JSON.parse(row.embedding) as number[]);
        }
        return result;
    }

    /** Up to `limit` ids that still have no embedding. */
    async findMissing(target: EmbeddingTarget, limit: number): Promise<string[]> {
        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error('limit must be a positive integer');
        }
        const { table, key } = this.target(target);

        const rows = await this.prisma.$queryRaw<{ id: string }[]>(
            Prisma.sql`SELECT ${key} AS "id" FROM ${table}
                       WHERE "embedding" IS NULL
                       ORDER BY ${key}
                       LIMIT ${limit}`,
        );
        return rows.map((row) => row.id);
    }
}
