// Read-only PostgreSQL catalog probe. Supply DATABASE_URL in the environment.
const { Client } = require(require.resolve('pg', { paths: [process.cwd()] }));

async function main() {
  let client;
  let passes = 0;
  let failures = 0;

  const check = async (label, inspect) => {
    let result;
    try {
      result = await inspect();
    } catch (error) {
      result = { ok: false, detail: `query failed (${error.code ?? error.message})` };
    }
    if (result.ok) passes++;
    else failures++;
    console.log(`${result.ok ? 'PASS' : 'FAIL'} — ${label}: ${result.detail}`);
    return result.ok;
  };

  const foreignKey = async (table, constraint, expected) => {
    const result = await client.query(
      `SELECT confdeltype FROM pg_catalog.pg_constraint
       WHERE conname = $1 AND contype = 'f' AND conrelid = to_regclass($2)`,
      [constraint, table],
    );
    const actual = result.rows[0]?.confdeltype;
    return {
      ok: result.rowCount === 1 && actual === expected,
      detail: `expected ${expected}, got ${actual ?? '(missing)'} (${result.rowCount} constraint(s))`,
    };
  };

  const enumValues = async (type, sql, expected) => {
    const enumType = await client.query(
      `SELECT typtype FROM pg_catalog.pg_type WHERE oid = to_regtype($1)`,
      [type],
    );
    if (enumType.rowCount !== 1 || enumType.rows[0].typtype !== 'e') {
      return { ok: false, detail: 'enum type missing or not an enum' };
    }
    const result = await client.query(sql);
    const actual = result.rows.map((row) => row.value);
    return {
      ok: actual.length === expected.length && actual.every((value, i) => value === expected[i]),
      detail: `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    };
  };

  try {
    const controlPassed = await check('CONTROL applications_organization_id_fkey confdeltype', async () => {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) return { ok: false, detail: 'DATABASE_URL is required' };
      client = new Client({ connectionString });
      await client.connect();
      return foreignKey('applications', 'applications_organization_id_fkey', 'r');
    });
    if (!controlPassed) {
      console.log('instrument broken: CONTROL did not PASS; remaining checks were not run');
      process.exitCode = 2;
      return;
    }

    await check('email_notifications table exists', async () => {
      const result = await client.query(`SELECT to_regclass('email_notifications') AS relation`);
      return {
        ok: result.rows[0].relation !== null,
        detail: result.rows[0].relation ?? '(missing)',
      };
    });

    await check('email_notification_type values and order', () => enumValues(
      'email_notification_type',
      `SELECT unnest(enum_range(NULL::email_notification_type))::text AS value`,
      [
        'application_received',
        'application_interview',
        'application_offer',
        'application_hired',
        'application_rejected',
        'schedule_created',
        'schedule_updated',
        'schedule_cancelled',
      ],
    ));

    await check('email_notification_status values and order', () => enumValues(
      'email_notification_status',
      `SELECT unnest(enum_range(NULL::email_notification_status))::text AS value`,
      ['pending', 'sent', 'failed', 'skipped'],
    ));

    for (const [constraint, expected] of [
      ['email_notifications_organization_id_fkey', 'r'],
      ['email_notifications_recipient_user_id_fkey', 'c'],
      ['email_notifications_application_id_fkey', 'c'],
    ]) {
      await check(`${constraint} confdeltype`, () => foreignKey('email_notifications', constraint, expected));
    }

    await check('email_notifications.last_error is character varying(500)', async () => {
      const result = await client.query(
        `SELECT pg_catalog.format_type(atttypid, atttypmod) AS column_type
         FROM pg_catalog.pg_attribute
         WHERE attrelid = to_regclass('email_notifications')
           AND attname = 'last_error' AND NOT attisdropped`,
      );
      const actual = result.rows[0]?.column_type;
      return {
        ok: result.rowCount === 1 && actual === 'character varying(500)',
        detail: actual ?? '(missing)',
      };
    });

    await check('email_notifications.status defaults to pending', async () => {
      const result = await client.query(
        `SELECT pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
         FROM pg_catalog.pg_attrdef AS d
         JOIN pg_catalog.pg_attribute AS a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
         WHERE a.attrelid = to_regclass('email_notifications')
           AND a.attname = 'status' AND NOT a.attisdropped`,
      );
      const actual = result.rows[0]?.column_default;
      return {
        ok: result.rowCount === 1 && typeof actual === 'string' && actual.includes('pending'),
        detail: actual ?? '(missing)',
      };
    });

    for (const index of [
      'email_notifications_organization_id_idx',
      'email_notifications_application_id_idx',
    ]) {
      await check(`${index} exists`, async () => {
        const result = await client.query(
          `SELECT indexname FROM pg_catalog.pg_indexes
           WHERE tablename = 'email_notifications' AND indexname = $1
             AND schemaname = (
               SELECT n.nspname FROM pg_catalog.pg_class AS t
               JOIN pg_catalog.pg_namespace AS n ON n.oid = t.relnamespace
               WHERE t.oid = to_regclass('email_notifications')
             )`,
          [index],
        );
        return { ok: result.rowCount === 1, detail: result.rowCount === 1 ? 'present' : '(missing)' };
      });
    }

    process.exitCode = failures === 0 ? 0 : 1;
  } finally {
    try {
      if (client) await client.end();
    } catch (error) {
      console.error(`Client close failed (${error.code ?? error.message})`);
      if (process.exitCode !== 2) process.exitCode = 1;
    }
    console.log(`RESULT: ${passes} PASS, ${failures} FAIL`);
  }
}

main().catch((error) => {
  console.error(`Probe error (${error.code ?? error.message})`);
  process.exitCode = 2;
});
