import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from './password';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For now, we'll use a simple email/password check
        // In production, you'd want proper password hashing
        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (user.length === 0) {
          return null;
        }

        const foundUser = user[0];

        // Check if user has a hashed password
        if (foundUser.passwordHash) {
          // Verify hashed password
          const isValidPassword = await verifyPassword(credentials.password, foundUser.passwordHash);
          
          if (isValidPassword) {
            return {
              id: foundUser.id,
              email: foundUser.email,
              name: foundUser.name,
              role: foundUser.role,
              storeLocation: foundUser.storeLocation,
            };
          } else {
            return null; // Invalid password
          }
        }

        // Fallback for users without hashed passwords (temporary)
        // Bootstrap admin login and temp passwords
        if (foundUser.email === 'bootstrap@admin.com' && credentials.password === 'admin123') {
          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role,
            storeLocation: foundUser.storeLocation,
          };
        }

        // Temporary fallback for existing users without passwords
        if (credentials.password === 'temp123' || credentials.password === 'admin123') {
          return {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role,
            storeLocation: foundUser.storeLocation,
          };
        }

        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.storeLocation = (user as any).storeLocation;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).storeLocation = token.storeLocation;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
