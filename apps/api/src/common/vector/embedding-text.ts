import { EMBEDDING_TARGETS, EmbeddingTarget } from './vector-search.service';

type Row = Record<string, unknown>;

const isRecord = (value: unknown): value is Row =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Non-blank strings of a list, or of a comma/semicolon/newline separated string. */
function stringList(value: unknown): string[] {
    const items = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(/[,;\n]/)
          : [];
    return items
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
}

function skillText(row: Row): string | null {
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) return null;

    const synonyms = (Array.isArray(row.synonyms) ? stringList(row.synonyms) : []).filter((synonym) => synonym !== name);
    return [name, ...synonyms].join('; ');
}

function cvParsedDataText(row: Row): string | null {
    const summary = typeof row.summary === 'string' ? row.summary.trim() : '';
    const skills = isRecord(row.skills) ? stringList(row.skills.technical) : [];
    const positions = Array.isArray(row.experience)
        ? row.experience.flatMap((entry) => (isRecord(entry) ? stringList([entry.position]) : []))
        : [];

    const parts = [
        summary,
        skills.length ? `Skills: ${skills.join('; ')}` : '',
        positions.length ? `Positions: ${positions.join('; ')}` : '',
    ].filter(Boolean);
    return parts.length ? parts.join('\n') : null;
}

const BUILDERS: Record<EmbeddingTarget, (row: Row) => string | null> = {
    skill: skillText,
    cv_parsed_data: cvParsedDataText,
};

/**
 * The text that gets embedded for one row, or null when the row has nothing worth embedding
 * (an empty text would be rejected by the API and carries no meaning anyway).
 */
export function buildEmbeddingText(target: EmbeddingTarget, row: unknown): string | null {
    if (!(target in EMBEDDING_TARGETS)) throw new Error(`Unknown embedding target: ${String(target)}`);
    return BUILDERS[target](isRecord(row) ? row : {});
}
