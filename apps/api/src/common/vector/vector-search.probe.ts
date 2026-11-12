/**
 * One-off probe against the REAL database of docker-compose.test.yml (Task 1.2, criterion C1).
 * Not a unit test: the name has no `.spec`, so `nx test api` never runs it. Run it with
 *
 *   DATABASE_URL=postgresql://ats_test:ats-local-test@localhost:55432/ats_test \
 *   npx jest --config apps/api/jest.config.ts --runInBand --testMatch '**\/vector-search.probe.ts'
 *
 * It exists because plain Node cannot import the generated Prisma client (TypeScript with extensionless
 * imports), and the unit tests mock Prisma: this is the only place the raw SQL meets pgvector.
 */
import { randomUUID } from 'node:crypto';
import { Prisma } from '@ats-platform/database';
import { PrismaService } from '../prisma/prisma.service';
import { EMBEDDING_DIMENSIONS } from '../external-apis/embedding/embedding.service';
import { VectorSearchService } from './vector-search.service';

const axis = (index: number, weight = 1, other?: [number, number]) => {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    vector[index] = weight;
    if (other) vector[other[0]] = other[1];
    return vector;
};

describe('VectorSearchService against PostgreSQL + pgvector', () => {
    const prisma = new PrismaService();
    const service = new VectorSearchService(prisma);
    const runId = randomUUID().slice(0, 8);
    const ids = { near: randomUUID(), middle: randomUUID(), far: randomUUID(), empty: randomUUID() };

    beforeAll(async () => {
        await prisma.$connect();
        expect(((await prisma.$queryRaw<{ db: string }[]>`SELECT current_database() AS db`))[0].db).toBe('ats_test');
        // Created through the ordinary Prisma client: it must ignore the Unsupported embedding column.
        for (const [label, skillId] of Object.entries(ids)) {
            await prisma.skill.create({ data: { skillId, name: `probe-${label}-${runId}` } });
        }
    });

    afterAll(async () => {
        await prisma.skill.deleteMany({ where: { skillId: { in: Object.values(ids) } } });
        await prisma.$disconnect();
    });

    it('writes vectors, reads them back exactly, and orders by cosine distance', async () => {
        // Query vector is axis 0. near = axis 0, middle = mostly axis 0 with a little axis 1, far = axis 1.
        await service.writeEmbedding('skill', ids.near, axis(0));
        await service.writeEmbedding('skill', ids.middle, axis(0, 0.9, [1, 0.1]));
        await service.writeEmbedding('skill', ids.far, axis(1));

        const stored = await service.readEmbeddings('skill', Object.values(ids));
        expect(stored.size).toBe(3);
        expect(stored.has(ids.empty)).toBe(false);
        expect(stored.get(ids.near)).toEqual(axis(0));
        expect(stored.get(ids.far)).toEqual(axis(1));
        // float4 round-trip: 0.9 and 0.1 come back as the nearest single-precision values.
        expect(stored.get(ids.middle)?.[0]).toBeCloseTo(0.9, 6);
        expect(stored.get(ids.middle)?.[1]).toBeCloseTo(0.1, 6);

        const literal = `[${axis(0).join(',')}]`;
        const ranked = await prisma.$queryRaw<{ skill_id: string; distance: number }[]>(
            Prisma.sql`SELECT skill_id, (embedding <=> ${literal}::vector)::float8 AS distance
                       FROM skills
                       WHERE skill_id IN (${Prisma.join([ids.near, ids.middle, ids.far])})
                       ORDER BY embedding <=> ${literal}::vector`,
        );
        expect(ranked.map((row) => row.skill_id)).toEqual([ids.near, ids.middle, ids.far]);
        expect(ranked[0].distance).toBeCloseTo(0, 6);
        expect(ranked[2].distance).toBeCloseTo(1, 6);
        console.log('cosine distances (near, middle, far):', ranked.map((row) => row.distance.toFixed(6)).join(', '));
    });

    it('findMissing returns only rows without an embedding, then none after they are written', async () => {
        const before = await service.findMissing('skill', 1000);
        expect(before).toContain(ids.empty);
        expect(before).not.toContain(ids.near);

        await service.writeEmbedding('skill', ids.empty, axis(5));
        const after = await service.findMissing('skill', 1000);
        expect(after).not.toContain(ids.empty);
    });

    it('a normal Prisma read of a row that has an embedding still works', async () => {
        const skill = await prisma.skill.findUnique({ where: { skillId: ids.near } });
        expect(skill?.name).toBe(`probe-near-${runId}`);
        expect(skill).not.toHaveProperty('embedding');
    });

    it('writing to a row that does not exist updates nothing and does not throw', async () => {
        await expect(service.writeEmbedding('skill', randomUUID(), axis(2))).resolves.toBeUndefined();
    });

    it('a wrong dimension never reaches PostgreSQL', async () => {
        await expect(service.writeEmbedding('skill', ids.near, axis(0).slice(1))).rejects.toThrow(/1536/);
    });
});
