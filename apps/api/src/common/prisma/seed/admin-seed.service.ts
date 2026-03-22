import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
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

  private async seedDefaultAiConfig() {
    const existingDefaultConfig = await this.prisma.aiConfig.findFirst({
      where: { isDefault: true },
      select: { configId: true, name: true },
    });

    if (existingDefaultConfig) {
      this.logger.log(
        `AI config seed skipped: default config already exists (${existingDefaultConfig.name})`,
      );
      return;
    }

    const defaultConfig = await this.prisma.aiConfig.create({
      data: {
        name: process.env.AI_DEFAULT_CONFIG_NAME || 'Default CV Screening Config',
        isDefault: true,
        skillsWeight: 0.5,
        experienceWeight: 0.3,
        educationWeight: 0.2,
        minimumScoreThreshold: 0.6,
      },
      select: { configId: true, name: true },
    });

    this.logger.log(`Seeded default AI config: ${defaultConfig.name}`);
  }
}