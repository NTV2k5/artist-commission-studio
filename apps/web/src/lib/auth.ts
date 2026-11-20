import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

const providers: any[] = [
  Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Mật khẩu', type: 'password' },
      name: { label: 'Họ tên', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials?.email) {
        return null;
      }

      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string | undefined;
      const name = (credentials.name as string) || email.split('@')[0];
      const artistAdminEmail = (process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn').toLowerCase().trim();
      const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const apiBase = rawApiBase.replace(/\/+$/, '').replace(/\/api\/v1$/, '');

      try {
        if (password) {
          // Normal login with password
          const res = await fetch(`${apiBase}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              backendToken: data.token,
            };
          }
          return null;
        } else {
          // Demo quick login or passwordless sync
          const res = await fetch(`${apiBase}/api/v1/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name }),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              backendToken: data.token,
            };
          }
        }
      } catch (error) {
        console.warn('Backend auth request failed:', error);
      }

      // Fallback if backend temporarily offline
      const role = email === artistAdminEmail ? 'ARTIST' : 'CUSTOMER';
      return {
        id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        name,
        role,
      };
    },
  }),
];

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  !process.env.GOOGLE_CLIENT_ID.includes('dummy')
) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role || 'CUSTOMER';
        token.backendToken = (user as any).backendToken;
      }
      // If logging in via Google OAuth, sync with backend to get role and backend JWT
      if (account?.provider === 'google' && token.email) {
        try {
          const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const apiBase = rawApiBase.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
          const res = await fetch(`${apiBase}/api/v1/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: token.email,
              name: token.name || token.email.split('@')[0],
              avatarUrl: token.picture,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.role = data.user.role;
            token.backendToken = data.token;
            token.sub = data.user.id;
          }
        } catch (err) {
          console.warn('Google user backend sync error:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = (token.role as 'ARTIST' | 'CUSTOMER') || 'CUSTOMER';
        session.user.backendToken = token.backendToken as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'artist_studio_super_secret_session_key_12345',
});
