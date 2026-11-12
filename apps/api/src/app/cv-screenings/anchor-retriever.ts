import { Injectable } from '@nestjs/common';
import { effectiveScreeningScores, type RagMode } from '@ats-platform/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { VectorSearchService } from '../../common/vector/vector-search.service';
import { technicalSkills } from './cv-technical-skills';

/** How many reviewed screenings of the same posting are shown to the model, unless ANCHOR_COUNT says otherwise. */
export const DEFAULT_ANCHOR_COUNT = 3;

/**
 * A reviewed screening of the same posting, shown to the model as a calibration example. It carries
 * the CV's content and the scores AFTER review, and nothing that identifies the candidate.
 */
export interface Anchor {
    screeningId: string;
    cvSummary: string | null;
    cvSkills: string[];
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
}

/**
 * The screening mode (R5). A forced mode always wins; otherwise `none` when the embeddings cannot be
 * used, `skills_anchors` once the posting has at least k usable reviewed screenings, else `skills`.
 */
export function selectRagMode(input: {
    forced?: RagMode;
    embeddingsAvailable: boolean;
    reviewedCount: number;
    k: number;
}): RagMode {
    if (input.forced) return input.forced;
    if (!input.embeddingsAvailable) return 'none';
    return input.reviewedCount >= input.k ? 'skills_anchors' : 'skills';
}

@Injectable()
export class AnchorRetriever {
    constructor(
        private readonly prisma: PrismaService,
        private readonly vectorSearch: VectorSearchService,
    ) {}

    /**
     * The k reviewed screenings of `jobId` whose CV is closest to this one, nearest first. Never this
     * application itself, and never another posting (so never another organization). A CV with no
     * vector yet, or a posting with no usable reviewed screening, gives an empty list.
     */
    async retrieve(jobId: string, applicationId: string, cvParsedDataId: string, k: number): Promise<Anchor[]> {
        const vectors = await this.vectorSearch.readEmbeddings('cv_parsed_data', [cvParsedDataId]);
        const cvVector = vectors.get(cvParsedDataId);
        if (!cvVector) return [];

        const ids = await this.vectorSearch.nearestAnchorScreenings(jobId, applicationId, cvVector, k);
        if (ids.length === 0) return [];

        const rows = await this.prisma.cVScreening.findMany({
            where: { screeningId: { in: ids } },
            select: {
                screeningId: true,
                skillsScore: true,
                experienceScore: true,
                educationScore: true,
                reviewedAt: true,
                reviewedSkillsScore: true,
                reviewedExperienceScore: true,
                reviewedEducationScore: true,
                cv: { select: { parsedData: { select: { summary: true, skills: true } } } },
            },
        });
        const byId = new Map(rows.map((row) => [row.screeningId, row]));

        return ids.flatMap((id) => {
            const row = byId.get(id);
            if (!row) return [];
            const scores = effectiveScreeningScores(row);
            if (scores.skills === null || scores.experience === null || scores.education === null) return [];
            return [
                {
                    screeningId: id,
                    cvSummary: row.cv?.parsedData?.summary ?? null,
                    cvSkills: technicalSkills(row.cv?.parsedData),
                    skillsScore: scores.skills,
                    experienceScore: scores.experience,
                    educationScore: scores.education,
                },
            ];
        });
    }
}
