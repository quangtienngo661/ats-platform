import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { cvParsedDataIncludeOptions } from "../../../common/utils/include-options.util";

@Injectable()
export class CvParsedDataService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async create(cvId: string, parsedData: any, tx?: any) {
        return await (tx || this.prisma).cVParsedData.create({
            data: {
                cvId,
                summary: parsedData.summary,
                location: parsedData.location,
                skills: parsedData.skills as object,
                experience: parsedData.experience as object,
                education: parsedData.education as object,
                projects: parsedData.projects as object,
                certificates: parsedData.certificates as object,
            },
            omit: { cvId: true },
            include: {
                ...cvParsedDataIncludeOptions
            }
        });
    }
}