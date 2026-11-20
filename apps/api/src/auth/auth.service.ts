import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
   * Registers a new user with email, password, and name.
   */
  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const artistAdminEmail = (process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn').toLowerCase().trim();
    const assignedRole = normalizedEmail === artistAdminEmail ? Role.ARTIST : Role.CUSTOMER;

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.passwordHash) {
      throw new ConflictException('Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    let user;
    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: dto.name || existing.name,
          phone: dto.phone || existing.phone,
          passwordHash,
          role: assignedRole,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name || normalizedEmail.split('@')[0],
          phone: dto.phone,
          passwordHash,
          role: assignedRole,
        },
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  /**
   * Logs in a user by comparing email and bcrypt password.
   */
  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  async validateUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
