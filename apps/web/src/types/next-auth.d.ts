import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    role?: 'ARTIST' | 'CUSTOMER';
    backendToken?: string;
    accessToken?: string;
  }

  interface Session {
    role?: 'ARTIST' | 'CUSTOMER';
    accessToken?: string;
    backendToken?: string;
    user: {
      id?: string;
      role?: 'ARTIST' | 'CUSTOMER';
      backendToken?: string;
      accessToken?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ARTIST' | 'CUSTOMER';
    backendToken?: string;
    accessToken?: string;
  }
}
