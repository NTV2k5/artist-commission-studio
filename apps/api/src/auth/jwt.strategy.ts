import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_characters_long',
    });
  }

  async validate(payload: JwtPayload) {
    const artistAdminEmail = (process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn').toLowerCase().trim();
    const isArtistAdmin = payload.email && payload.email.toLowerCase().trim() === artistAdminEmail;

    let user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user && payload.email) {
      user = await this.prisma.user.findUnique({
        where: { email: payload.email.toLowerCase().trim() },
      });
    }

    if (!user && isArtistAdmin) {
      user = await this.prisma.user.upsert({
        where: { email: artistAdminEmail },
        update: { role: Role.ARTIST },
        create: {
          id: payload.sub || undefined,
          email: artistAdminEmail,
          name: payload.name || 'Họa sĩ Quốc Tuấn',
          role: Role.ARTIST,
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (isArtistAdmin && user.role !== Role.ARTIST) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: Role.ARTIST },
      });
    }

    return user;
  }
}
