import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    role?: 'ARTIST' | 'CUSTOMER';
    backendToken?: string;
  }

  interface Session {
    user: {
      id?: string;
      role?: 'ARTIST' | 'CUSTOMER';
      backendToken?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'ARTIST' | 'CUSTOMER';
    backendToken?: string;
  }
}
