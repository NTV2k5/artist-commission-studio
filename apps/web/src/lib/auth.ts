import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Họ tên', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const name = (credentials.name as string) || email.split('@')[0];
        const artistAdminEmail = (process.env.ARTIST_ADMIN_EMAIL || 'artist@studio.vn').toLowerCase().trim();

        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
        } catch (error) {
          console.warn('Backend sync failed, falling back to local credentials eval:', error);
        }

        // Fallback when backend is temporarily offline during build / preview
        const role = email === artistAdminEmail ? 'ARTIST' : 'CUSTOMER';
        return {
          id: `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          name,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.backendToken = (user as any).backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as 'ARTIST' | 'CUSTOMER';
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
