import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import pool from '@/lib/db';

// Define custom types for better type safety
interface User {
  id: string;
  email: string;
  company: string;
  password: string;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      company: string;
    }
  }
  interface User {
    id: string;
    email: string;
    company: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    company: string;
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Please provide NEXTAUTH_SECRET environment variable');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        let retries = 3;
        while (retries > 0) {
          try {
            const client = await pool.connect();
            try {
              const result = await client.query<User>(
                'SELECT * FROM "User" WHERE email = $1',
                [credentials.email]
              );
              
              const user = result.rows[0];
              if (!user) {
                console.log('No user found');
                return null;
              }
              
              const isValid = await compare(credentials.password, user.password);
              if (!isValid) {
                console.log('Invalid password');
                return null;
              }
              
              return {
                id: user.id,
                email: user.email,
                company: user.company,
                password: user.password
              };
            } finally {
              client.release();
            }
          } catch (error) {
            console.error(`Authentication attempt ${4 - retries} failed:`, error);
            retries--;
            if (retries === 0) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.company = user.company;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.company = token.company;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
};