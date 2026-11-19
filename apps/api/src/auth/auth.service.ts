import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface SyncUserInput {
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Syncs user with database and auto-assigns ARTIST role if email matches ARTIST_ADMIN_EMAIL
   */
  async syncUser(input: SyncUserInput) {
    const artistAdminEmail = (process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn').toLowerCase().trim();
    const normalizedEmail = input.email.toLowerCase().trim();
    const assignedRole = normalizedEmail === artistAdminEmail ? Role.ARTIST : Role.CUSTOMER;

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: input.name || undefined,
        avatarUrl: input.avatarUrl || undefined,
        phone: input.phone || undefined,
        role: assignedRole,
      },
      create: {
        email: normalizedEmail,
        name: input.name || normalizedEmail.split('@')[0],
        avatarUrl: input.avatarUrl,
        phone: input.phone,
        role: assignedRole,
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user,
      token,
    };
  }

  async validateUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
