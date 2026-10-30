/** The distinct, non-blank technical skills of a parsed CV (`skills.technical`, a list or one separated string). */
export function technicalSkills(cvParsedData: { skills?: unknown } | null | undefined): string[] {
    const skills = cvParsedData?.skills;
    const technical =
        skills && typeof skills === 'object' && !Array.isArray(skills)
            ? (skills as Record<string, unknown>).technical
            : undefined;
    const items = Array.isArray(technical)
        ? technical
        : typeof technical === 'string'
          ? technical.split(/[,;\n]/)
          : [];

    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of items) {
        if (typeof item !== 'string') continue;
        const text = item.trim();
        if (text && !seen.has(text.toLowerCase())) {
            seen.add(text.toLowerCase());
            result.push(text);
        }
    }
    return result;
}
