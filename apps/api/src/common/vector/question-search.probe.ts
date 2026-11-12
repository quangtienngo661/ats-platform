/**
 * One-off probe against a REAL PostgreSQL + pgvector (Task 4.2, criteria C10/C11): does nearestQuestions
 * keep to the topic and the difficulty, skip hidden questions and questions with no vector, rank by
 * cosine distance, and return expected_points as an array?
 * Not a unit test: the name has no `.spec`, so `nx test api` never runs it. Run it against a database
 * that has the migrations applied:
 *
 *   DATABASE_URL=postgresql://postgres:probe@127.0.0.1:55442/probe \
 *   npx jest --config apps/api/jest.config.ts --runInBand --testMatch '**\/question-search.probe.ts'
 */
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PrismaService } from '../prisma/prisma.service';
import { EMBEDDING_DIMENSIONS } from '../external-apis/embedding/embedding.service';
import { VectorSearchService } from './vector-search.service';

const vec = (x: number, y: number) => {
    const v = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    v[0] = x;
    v[1] = y;
    return v;
};

describe('nearestQuestions against PostgreSQL + pgvector', () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaService();
    const service = new VectorSearchService(prisma);
    const run = randomUUID().slice(0, 8);
    const topics = { backend: randomUUID(), frontend: randomUUID() };
    const q = (name: string, topic: keyof typeof topics, difficulty: string, active: boolean, vector: number[] | null) => ({
        name, id: randomUUID(), topicId: topics[topic], difficulty, active, vector,
    });
    const questions = [
        q('near', 'backend', 'medium', true, vec(0.95, 0.05)),
        q('mid', 'backend', 'medium', true, vec(0.6, 0.4)),
        q('far', 'backend', 'medium', true, vec(0, 1)),
        q('hidden', 'backend', 'medium', false, vec(1, 0)), // closest of all, but hidden
        q('novector', 'backend', 'medium', true, null),
        q('harder', 'backend', 'hard', true, vec(1, 0)), // closest of all, but another difficulty
        q('otherTopic', 'frontend', 'medium', true, vec(1, 0)), // closest of all, but another topic
    ];
    const by = (name: string) => questions.find((item) => item.name === name)!;

    beforeAll(async () => {
        await prisma.$connect();
        for (const [name, id] of Object.entries(topics)) {
            await pool.query('INSERT INTO interview_topics (topic_id,name) VALUES ($1,$2)', [id, `probe ${name} ${run}`]);
        }
        for (const item of questions) {
            await pool.query(
                `INSERT INTO interview_questions (question_id,topic_id,difficulty,question_text,expected_points,is_active,updated_at)
                 VALUES ($1,$2,$3::difficulty_level,$4,$5::jsonb,$6,now())`,
                [item.id, item.topicId, item.difficulty, `Question ${item.name}`, JSON.stringify([`point of ${item.name}`]), item.active],
            );
            if (item.vector) await service.writeEmbedding('interview_question', item.id, item.vector);
        }
    });

    afterAll(async () => {
        await pool.query('DELETE FROM interview_questions WHERE question_id = ANY($1)', [questions.map((item) => item.id)]);
        await pool.query('DELETE FROM interview_topics WHERE topic_id = ANY($1)', [Object.values(topics)]);
        await pool.end();
        await prisma.$disconnect();
    });

    it('control: the rows the search must skip really are the closest ones in the table', async () => {
        const unfiltered = await pool.query(
            `SELECT question_text FROM interview_questions WHERE question_id = ANY($1) AND embedding IS NOT NULL
             ORDER BY embedding <=> $2::vector LIMIT 4`,
            [questions.map((item) => item.id), `[${vec(1, 0).join(',')}]`],
        );
        const top = unfiltered.rows.map((row) => row.question_text);
        expect(top).toEqual(expect.arrayContaining(['Question hidden', 'Question harder', 'Question otherTopic']));
    });

    it('returns the active, vectorised questions of the topic at that difficulty, nearest first, with points as an array', async () => {
        const result = await service.nearestQuestions(topics.backend, 'medium', vec(1, 0), 25);

        expect(result.map((row) => row.questionId)).toEqual([by('near').id, by('mid').id, by('far').id]);
        expect(result[0]).toEqual({
            questionId: by('near').id,
            questionText: 'Question near',
            expectedPoints: ['point of near'],
            difficulty: 'medium',
        });
        console.log('nearest first:', result.map((row) => row.questionText).join(' > '), '— skipped: hidden, novector, harder, otherTopic');
    });

    it('limit cuts the list from the far end', async () => {
        const result = await service.nearestQuestions(topics.backend, 'medium', vec(1, 0), 2);

        expect(result.map((row) => row.questionId)).toEqual([by('near').id, by('mid').id]);
    });

    it('another difficulty or topic sees only its own', async () => {
        expect((await service.nearestQuestions(topics.backend, 'hard', vec(1, 0), 25)).map((r) => r.questionId)).toEqual([by('harder').id]);
        expect((await service.nearestQuestions(topics.frontend, 'medium', vec(1, 0), 25)).map((r) => r.questionId)).toEqual([by('otherTopic').id]);
        expect(await service.nearestQuestions(topics.frontend, 'easy', vec(1, 0), 25)).toEqual([]);
    });
});
