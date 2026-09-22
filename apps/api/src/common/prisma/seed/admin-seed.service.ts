import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { defaultAiConfigData } from '../../constants/default-ai-config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedDefaultAiConfig();
  }

  private async seedAdmin() {
    const adminCount = await this.prisma.user.count({
      where: { role: 'admin' },
    });

    if (adminCount > 0) {
      this.logger.log('Admin seed skipped: admin user already exists');
      return;
    }

    const email = process.env.ADMIN_EMAIL || 'admin@ats.local';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const fullName = process.env.ADMIN_FULL_NAME || 'System Administrator';

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
      select: { userId: true },
    });

    if (existingByEmail) {
      this.logger.warn(
        `Admin seed skipped: email ${email} already exists but role is not admin`,
      );
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
      select: { userId: true, email: true },
    });

    this.logger.log(`Seeded initial admin account: ${email}`);

    if (!process.env.ADMIN_PASSWORD) {
      this.logger.warn(
        'ADMIN_PASSWORD is not set. Using default password Admin@123. Please change it immediately.',
      );
    }
  }

  /**
   * Every organization needs its own default screening config (they are per
   * organization). Seeds one for each organization that has none — a safety net,
   * since OrganizationsService already creates one with every new organization.
   *
   * This used to check for "a default config" across the whole table, which is
   * satisfied by any single organization's and would leave every other one without.
   */
  private async seedDefaultAiConfig() {
    const organizationsWithoutDefault = await this.prisma.organization.findMany({
      where: { aiConfigs: { none: { isDefault: true } } },
      select: { organizationId: true, name: true },
    });

    if (organizationsWithoutDefault.length === 0) {
      this.logger.log(
        'AI config seed skipped: every organization already has a default config',
      );
      return;
    }

    for (const organization of organizationsWithoutDefault) {
      const config = await this.prisma.aiConfig.create({
        data: {
          ...defaultAiConfigData(),
          organizationId: organization.organizationId,
        },
        select: { name: true },
      });

      this.logger.log(
        `Seeded default AI config "${config.name}" for organization ${organization.name}`,
      );
    }
  }
}
