import { Injectable } from "@nestjs/common";
import { PrismaService } from "apps/api/src/common/prisma/prisma.service";
import { cvParsedDataIncludeOptions } from "apps/api/src/common/utils/include-options.util";

@Injectable()
export class CvParsedDataService {
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async create(cvId: string, parsedData: any, tx?: any) {
        return (tx || this.prisma).cVParsedData.create({
            data: {
                cvId,
                name: parsedData.name,
                email: parsedData.email,
                phoneNumber: parsedData.phone,
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