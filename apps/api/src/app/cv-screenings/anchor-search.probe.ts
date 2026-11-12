/**
 * One-off probe against the REAL database of docker-compose.test.yml (Task 3a.1, criterion C6):
 * does nearestAnchorScreenings really keep to the same posting, skip the application being screened,
 * and skip screenings that are unreviewed or whose CV has no vector?
 * Not a unit test: the name has no `.spec`, so `nx test api` never runs it. Run it with
 *
 *   DATABASE_URL=postgresql://ats_test:ats-local-test@localhost:55432/ats_test \
 *   npx jest --config apps/api/jest.config.ts --runInBand --testMatch '**\/anchor-search.probe.ts'
 */
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { PrismaService } from '../../common/prisma/prisma.service';
import { VectorSearchService } from '../../common/vector/vector-search.service';
import { EMBEDDING_DIMENSIONS } from '../../common/external-apis/embedding/embedding.service';

const vec = (x: number, y: number) => {
    const v = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    v[0] = x;
    v[1] = y;
    return v;
};

describe('nearestAnchorScreenings against PostgreSQL + pgvector', () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaService();
    const service = new VectorSearchService(prisma);
    const run = randomUUID().slice(0, 8);
    const ids = {
        org: randomUUID(), dept: randomUUID(), recruiterUser: randomUUID(), recruiter: randomUUID(),
        config: randomUUID(), jobA: randomUUID(), jobB: randomUUID(),
    };
    // name → how the row is set up. `reviewed` and `vector` are what the query must respect.
    const rows = [
        { name: 'current', job: 'jobA', reviewed: true, vector: vec(1, 0) }, // identical to the query, but it is the application being screened
        { name: 'r1', job: 'jobA', reviewed: true, vector: vec(0.9, 0.1) },
        { name: 'r2', job: 'jobA', reviewed: true, vector: vec(0.5, 0.5) },
        { name: 'r3', job: 'jobA', reviewed: true, vector: vec(0, 1) },
        { name: 'unreviewed', job: 'jobA', reviewed: false, vector: vec(1, 0) },
        { name: 'novector', job: 'jobA', reviewed: true, vector: null },
        { name: 'otherJob', job: 'jobB', reviewed: true, vector: vec(1, 0) }, // identical to the query, but another posting
    ].map((row) => ({
        ...row,
        applicationId: randomUUID(),
        screeningId: randomUUID(),
        cvId: randomUUID(),
        parsedId: randomUUID(),
        userId: randomUUID(),
        candidateId: randomUUID(),
    }));
    const by = (name: string) => rows.find((row) => row.name === name)!;

    beforeAll(async () => {
        await prisma.$connect();
        expect((await pool.query('SELECT current_database() AS db')).rows[0].db).toBe('ats_test');
        await pool.query('INSERT INTO organizations (organization_id,name,slug) VALUES ($1,$2,$3)', [ids.org, `anchor probe ${run}`, `anchor-probe-${run}`]);
        await pool.query('INSERT INTO departments (department_id,organization_id,name,color) VALUES ($1,$2,$3,$4)', [ids.dept, ids.org, `dept ${run}`, '#0071E3']);
        await pool.query(`INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified) VALUES ($1,$2,'x','Probe recruiter','recruiter',true)`, [ids.recruiterUser, `anchor-recruiter-${run}@ats.test`]);
        await pool.query('INSERT INTO recruiters (recruiter_id,user_id,organization_id,department_id,position) VALUES ($1,$2,$3,$4,$5)', [ids.recruiter, ids.recruiterUser, ids.org, ids.dept, 'Recruiter']);
        await pool.query(`INSERT INTO ai_configs (config_id,organization_id,name,is_default,skills_weight,experience_weight,education_weight,minimum_score_threshold) VALUES ($1,$2,'probe',true,0.5,0.3,0.2,60)`, [ids.config, ids.org]);
        for (const [job, jobId] of [['A', ids.jobA], ['B', ids.jobB]]) {
            await pool.query(`INSERT INTO job_postings (job_id,organization_id,department_id,created_by,title,location_type,status) VALUES ($1,$2,$3,$4,$5,'onsite','active')`, [jobId, ids.org, ids.dept, ids.recruiter, `probe job ${job} ${run}`]);
        }
        for (const row of rows) {
            const jobId = row.job === 'jobA' ? ids.jobA : ids.jobB;
            await pool.query(`INSERT INTO users (user_id,email,password_hash,full_name,role,email_verified) VALUES ($1,$2,'x',$3,'candidate',true)`, [row.userId, `anchor-${row.name}-${run}@ats.test`, `cand ${row.name}`]);
            await pool.query('INSERT INTO candidates (candidate_id,user_id) VALUES ($1,$2)', [row.candidateId, row.userId]);
            await pool.query(`INSERT INTO cvs (cv_id,candidate_id,file_name,file_path,parsing_status) VALUES ($1,$2,$3,$4,'completed')`, [row.cvId, row.candidateId, `${row.name}.pdf`, `probe/${run}/${row.name}.pdf`]);
            await pool.query(`INSERT INTO cv_parsed_data (id,cv_id,summary) VALUES ($1,$2,$3)`, [row.parsedId, row.cvId, `summary ${row.name}`]);
            await pool.query(`INSERT INTO applications (application_id,organization_id,job_id,candidate_id,cv_id,status) VALUES ($1,$2,$3,$4,$5,'screening')`, [row.applicationId, ids.org, jobId, row.candidateId, row.cvId]);
            await pool.query(
                `INSERT INTO cv_screenings (screening_id,organization_id,application_id,cv_id,config_id,status,overall_score,skills_score,experience_score,education_score,reviewed_at)
                 VALUES ($1,$2,$3,$4,$5,'completed',70,70,70,70,$6)`,
                [row.screeningId, ids.org, row.applicationId, row.cvId, ids.config, row.reviewed ? new Date() : null],
            );
            if (row.vector) await service.writeEmbedding('cv_parsed_data', row.parsedId, row.vector);
        }
    });

    afterAll(async () => {
        const appIds = rows.map((row) => row.applicationId);
        await pool.query('DELETE FROM cv_screenings WHERE application_id = ANY($1)', [appIds]);
        await pool.query('DELETE FROM applications WHERE application_id = ANY($1)', [appIds]);
        await pool.query('DELETE FROM job_postings WHERE organization_id=$1', [ids.org]);
        await pool.query('DELETE FROM recruiters WHERE organization_id=$1', [ids.org]);
        await pool.query('DELETE FROM departments WHERE organization_id=$1', [ids.org]);
        await pool.query('DELETE FROM ai_configs WHERE organization_id=$1', [ids.org]);
        await pool.query(`DELETE FROM users WHERE email LIKE $1`, [`%-${run}@ats.test`]);
        await pool.query('DELETE FROM organizations WHERE organization_id=$1', [ids.org]);
        await pool.end();
        await prisma.$disconnect();
    });

    it('control: the rows the query must skip really are the closest ones in the database', async () => {
        const unfiltered = await pool.query(
            `SELECT s.screening_id FROM cv_screenings s JOIN cv_parsed_data p ON p.cv_id = s.cv_id
             WHERE s.application_id = ANY($1) AND p.embedding IS NOT NULL
             ORDER BY p.embedding <=> $2::vector LIMIT 4`,
            [rows.map((row) => row.applicationId), `[${vec(1, 0).join(',')}]`],
        );
        const top = unfiltered.rows.map((row) => row.screening_id);
        // current, unreviewed and otherJob are all at distance 0: without the filters they would win.
        expect(top).toEqual(expect.arrayContaining([by('current').screeningId, by('unreviewed').screeningId, by('otherJob').screeningId]));
    });

    it('returns only reviewed screenings of the same posting that have a vector, nearest first, never the application itself', async () => {
        const result = await service.nearestAnchorScreenings(ids.jobA, by('current').applicationId, vec(1, 0), 3);

        expect(result).toEqual([by('r1').screeningId, by('r2').screeningId, by('r3').screeningId]);
        console.log('anchors (nearest first):', ['r1', 'r2', 'r3'].join(' > '), '— skipped: current, unreviewed, novector, otherJob');
    });

    it('asking for more than exist returns what exists, and k limits the list', async () => {
        const all = await service.nearestAnchorScreenings(ids.jobA, by('current').applicationId, vec(1, 0), 10);
        expect(all).toHaveLength(3);

        const two = await service.nearestAnchorScreenings(ids.jobA, by('current').applicationId, vec(1, 0), 2);
        expect(two).toEqual([by('r1').screeningId, by('r2').screeningId]);
    });

    it('the other posting sees its own screening only', async () => {
        const result = await service.nearestAnchorScreenings(ids.jobB, by('r1').applicationId, vec(1, 0), 3);

        expect(result).toEqual([by('otherJob').screeningId]);
    });
});
