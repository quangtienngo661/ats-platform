/** Used when SKILL_MATCH_THRESHOLD is not set. ASSUMPTION until the real-embedding probe (task 2.3) measures it. */
export const DEFAULT_SKILL_MATCH_THRESHOLD = 0.8;

export interface SkillMatch {
    skillId: string;
    name: string;
    /** The CV skill that matched, as the CV wrote it. */
    cvSkill: string;
    similarity: number;
}

export interface SkillMatchResult {
    matchedRequired: SkillMatch[];
    matchedOptional: SkillMatch[];
    missingRequired: { skillId: string; name: string }[];
}

export interface CvSkillVector {
    text: string;
    vector: number[];
}

export interface JobSkillVector {
    skillId: string;
    name: string;
    isRequired: boolean;
    /** Null while the skill has no embedding yet; it then matches by name only. */
    vector: number[] | null;
}

export function cosine(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must have the same length to be compared');

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i += 1) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    // A zero vector has no direction; 0 is "unrelated", where the division would give NaN.
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const normalise = (text: string) => text.trim().toLowerCase();

/**
 * Which skills of a job posting the CV covers. A job skill is matched when at least one CV skill has
 * cosine similarity >= threshold with it (so a similarity exactly at the threshold matches). Several
 * CV skills matching one job skill count once, named by the closest. Pure: every similarity is passed in
 * as a vector, so the boundaries can be tested without a database or an API.
 */
export function matchSkills(
    cvSkills: CvSkillVector[],
    jobSkills: JobSkillVector[],
    threshold: number,
): SkillMatchResult {
    // The same skill written twice (or in another case) is one skill.
    const seen = new Set<string>();
    const uniqueCvSkills = cvSkills
        .filter((skill) => {
            const key = normalise(skill.text);
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map((skill) => ({ ...skill, text: skill.text.trim() }));

    const result: SkillMatchResult = { matchedRequired: [], matchedOptional: [], missingRequired: [] };

    for (const jobSkill of jobSkills) {
        const best = closestCvSkill(uniqueCvSkills, jobSkill, threshold);
        if (best) {
            (jobSkill.isRequired ? result.matchedRequired : result.matchedOptional).push({
                skillId: jobSkill.skillId,
                name: jobSkill.name,
                cvSkill: best.text,
                similarity: best.similarity,
            });
        } else if (jobSkill.isRequired) {
            result.missingRequired.push({ skillId: jobSkill.skillId, name: jobSkill.name });
        }
    }

    return result;
}

function closestCvSkill(
    cvSkills: CvSkillVector[],
    jobSkill: JobSkillVector,
    threshold: number,
): { text: string; similarity: number } | null {
    if (jobSkill.vector === null) {
        const sameName = cvSkills.find((skill) => normalise(skill.text) === normalise(jobSkill.name));
        return sameName ? { text: sameName.text, similarity: 1 } : null;
    }

    let best: { text: string; similarity: number } | null = null;
    for (const skill of cvSkills) {
        const similarity = cosine(skill.vector, jobSkill.vector);
        if (similarity >= threshold && (best === null || similarity > best.similarity)) {
            best = { text: skill.text, similarity };
        }
    }
    return best;
}
