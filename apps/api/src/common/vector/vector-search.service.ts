import { Injectable } from '@nestjs/common';
import { DifficultyLevel, Prisma } from '@ats-platform/database';
import { PrismaService } from '../prisma/prisma.service';
import { EMBEDDING_DIMENSIONS } from '../external-apis/embedding/embedding.service';

/** A question of the interview bank as the similarity search returns it. */
export interface BankQuestion {
    questionId: string;
    questionText: string;
    expectedPoints: string[];
    difficulty: DifficultyLevel;
}

/**
 * Every table that holds a vector, with the column that identifies a row. Table and column
 * names cannot be SQL parameters, so they come ONLY from this constant map — a caller picks a
 * key, never a name.
 */
export const EMBEDDING_TARGETS = {
    skill: { table: 'skills', key: 'skill_id' },
    cv_parsed_data: { table: 'cv_parsed_data', key: 'id' },
    interview_question: { table: 'interview_questions', key: 'question_id' },
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

    /**
     * The `limit` active bank questions of `topicId` at exactly `difficulty` whose embedding is nearest
     * (cosine) to `vector`, nearest first. A hidden question or one with no vector yet is never returned.
     */
    async nearestQuestions(
        topicId: string,
        difficulty: DifficultyLevel,
        vector: number[],
        limit: number,
    ): Promise<BankQuestion[]> {
        if (!Number.isInteger(limit) || limit <= 0) throw new Error('limit must be a positive integer');
        const literal = toVectorLiteral(vector);

        return this.prisma.$queryRaw<BankQuestion[]>(
            Prisma.sql`SELECT "question_id" AS "questionId",
                              "question_text" AS "questionText",
                              "expected_points" AS "expectedPoints",
                              "difficulty"::text AS "difficulty"
                       FROM "interview_questions"
                       WHERE "topic_id" = ${topicId}
                         AND "difficulty" = ${difficulty}::difficulty_level
                         AND "is_active" = true
                         AND "embedding" IS NOT NULL
                       ORDER BY "embedding" <=> ${literal}::vector
                       LIMIT ${limit}`,
        );
    }

    /**
     * The ids of the k reviewed screenings of `jobId` whose CV is nearest (cosine) to `cvVector`,
     * nearest first. Three conditions are what keep anchors honest: the same posting only (so never
     * another organization), never `excludeApplicationId` (a screening is not its own anchor), and
     * only screenings that a human has reviewed and whose CV already has a vector.
     */
    async nearestAnchorScreenings(
        jobId: string,
        excludeApplicationId: string,
        cvVector: number[],
        k: number,
    ): Promise<string[]> {
        if (!Number.isInteger(k) || k <= 0) throw new Error('k must be a positive integer');
        const literal = toVectorLiteral(cvVector);

        const rows = await this.prisma.$queryRaw<{ id: string }[]>(
            Prisma.sql`SELECT s."screening_id" AS "id"
                       FROM "cv_screenings" s
                       JOIN "applications" a ON a."application_id" = s."application_id"
                       JOIN "cv_parsed_data" p ON p."cv_id" = s."cv_id"
                       WHERE a."job_id" = ${jobId}
                         AND s."application_id" <> ${excludeApplicationId}
                         AND s."reviewed_at" IS NOT NULL
                         AND p."embedding" IS NOT NULL
                       ORDER BY p."embedding" <=> ${literal}::vector
                       LIMIT ${k}`,
        );
        return rows.map((row) => row.id);
    }
}
