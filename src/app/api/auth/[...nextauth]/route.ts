import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createServerSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    // ===== Email + Password =====
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = createServerSupabase();
        if (!supabase) return null;

        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .eq('provider', 'email')
          .single();

        if (!user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),

    // ===== Kakao Login =====
    // Register at https://developers.kakao.com after business registration
    ...(process.env.KAKAO_CLIENT_ID ? [{
      id: 'kakao',
      name: 'Kakao',
      type: 'oauth' as const,
      authorization: {
        url: 'https://kauth.kakao.com/oauth/authorize',
        params: { scope: 'profile_nickname account_email' },
      },
      token: 'https://kauth.kakao.com/oauth/token',
      userinfo: 'https://kapi.kakao.com/v2/user/me',
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      profile(profile: any) {
        return {
          id: String(profile.id),
          name: profile.kakao_account?.profile?.nickname || 'Kakao User',
          email: profile.kakao_account?.email || `kakao_${profile.id}@sigeuldam.kr`,
          image: profile.kakao_account?.profile?.profile_image_url || '🌸',
        };
      },
    }] : []),

    // ===== Naver Login =====
    // Register at https://developers.naver.com after business registration
    ...(process.env.NAVER_CLIENT_ID ? [{
      id: 'naver',
      name: 'Naver',
      type: 'oauth' as const,
      authorization: {
        url: 'https://nid.naver.com/oauth2.0/authorize',
        params: {},
      },
      token: 'https://nid.naver.com/oauth2.0/token',
      userinfo: 'https://openapi.naver.com/v1/nid/me',
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
      profile(profile: any) {
        const data = profile.response;
        return {
          id: data.id,
          name: data.name || data.nickname || 'Naver User',
          email: data.email || `naver_${data.id}@sigeuldam.kr`,
          image: data.profile_image || '🌸',
        };
      },
    }] : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'kakao' || account?.provider === 'naver') {
        const supabase = createServerSupabase();
        if (!supabase) return true; // allow sign-in, DB sync later

        const referralCode = (user.name || 'U').slice(0, 2).toUpperCase()
          + Math.random().toString(36).slice(2, 6).toUpperCase();

        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('provider', account.provider)
          .eq('provider_id', user.id)
          .single();

        if (!existing) {
          const { data: newUser } = await supabase.from('users').insert({
            email: user.email || `${account.provider}_${user.id}@sigeuldam.kr`,
            name: user.name || `${account.provider} user`,
            avatar: (user.image && user.image.startsWith('http')) ? '🌸' : (user.image || '🌸'),
            provider: account.provider,
            provider_id: String(user.id),
            is_email_verified: true,
            referral_code: referralCode,
            pencils: 3,
          }).select('id').single();

          if (newUser) {
            user.id = newUser.id;
          }
        } else {
          user.id = existing.id;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;

        if (account?.provider === 'kakao' || account?.provider === 'naver') {
          const supabase = createServerSupabase();
          if (supabase) {
            const { data } = await supabase
              .from('users')
              .select('id')
              .eq('provider', account.provider)
              .eq('provider_id', String(user.id))
              .single();
            if (data) token.userId = data.id;
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as any).id = token.userId;

        const supabase = createServerSupabase();
        if (supabase) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', token.userId)
            .single();

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.email = dbUser.email;
            (session.user as any).avatar = dbUser.avatar;
            (session.user as any).pencils = dbUser.pencils;
            (session.user as any).isAdmin = dbUser.is_admin;
            (session.user as any).isEmailVerified = dbUser.is_email_verified;
            (session.user as any).collectedFlowers = dbUser.collected_flowers;
            (session.user as any).referralCode = dbUser.referral_code;
            (session.user as any).provider = dbUser.provider;
          }
        }
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET || 'sigeuldam-dev-secret-change-in-production',
});

export { handler as GET, handler as POST };
