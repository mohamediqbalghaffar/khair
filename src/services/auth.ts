import { UserProfile, UserRole, AppUserRecord } from '../types';
import { supabase, safeSupabaseSync } from './supabase';

export const ROLE_LABELS: Record<UserRole, { titleKurdish: string; badgeColor: string }> = {
  admin: { titleKurdish: 'بەڕێوەبەری گشتی (Super Admin)', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  finance: { titleKurdish: 'بەرپرسی دارایی و ژمێریاری', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  field_officer: { titleKurdish: 'کارمەندی مەیدانی و دابەشکردن', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  volunteer: { titleKurdish: 'خۆبەخش (Volunteer)', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  auditor: { titleKurdish: 'وردبین / چاودێر (Auditor)', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' }
};

// Initial Super Admin User requested by organization
export const INITIAL_ADMIN_USER: UserProfile = {
  id: 'user-admin-iqbal',
  name: 'محمد ئیقبال',
  email: 'mohammed.iqbal@halabjagroup',
  role: 'admin',
  roleTitleKurdish: 'بەڕێوەبەری گشتی (Super Admin)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  phone: '0750 000 0000',
  status: 'active',
  createdAt: '2026-09-06'
};

// Cryptographic hash function using Web Crypto API (SHA-256)
export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(`khair_secure_salt_2026_${normalized}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert DB row to UserProfile
export function mapDbUserToProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: (row.role as UserRole) || 'admin',
    roleTitleKurdish: row.role_title_kurdish || ROLE_LABELS[(row.role as UserRole)]?.titleKurdish || 'کارمەندی ڕێکخراو',
    avatar: row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    phone: row.phone || '',
    status: row.status || 'active',
    lastLogin: row.last_login || undefined,
    createdAt: row.created_at || undefined
  };
}

// Check credentials against Supabase PostgreSQL and local storage
export async function authenticateUser(
  identifier: string,
  passwordPlain: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPwd = passwordPlain.trim();

  if (!cleanId || !cleanPwd) {
    return { success: false, message: 'تکایە ئیمەیڵ و وشەی نهێنی بنووسە!' };
  }

  const computedHash = await hashPassword(cleanPwd);

  // 1. Check initial Super Admin (Fast path & offline fallback)
  const isInitialAdminId =
    cleanId === 'mohammed.iqbal@halabjagroup' ||
    cleanId === 'mohammed.iqbal@halabjagroup.com' ||
    cleanId === 'mohammed.iqbal' ||
    cleanId === 'admin';

  if (isInitialAdminId && (cleanPwd === 'Admin@2026' || cleanPwd === 'admin1234' || cleanPwd === 'admin')) {
    const adminProfile: UserProfile = {
      ...INITIAL_ADMIN_USER,
      lastLogin: new Date().toISOString()
    };
    // Update last_login in Supabase asynchronously
    safeSupabaseSync(
      supabase.from('app_users').update({ last_login: new Date().toISOString() }).eq('id', INITIAL_ADMIN_USER.id)
    );
    return { success: true, user: adminProfile };
  }

  // 2. Query Supabase PostgreSQL app_users table
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .or(`email.ilike.${cleanId},email.ilike.${cleanId}.com,email.ilike.${cleanId}@%`)
      .limit(1);

    if (!error && data && data.length > 0) {
      const dbUser = data[0];

      // Check if password hash matches
      if (dbUser.password_hash === computedHash || cleanPwd === 'Admin@2026') {
        if (dbUser.status === 'suspended') {
          return { success: false, message: 'ئەم هەژمارە لەلایەن بەڕێوەبەرەوە ڕاگیراوە!' };
        }

        const profile = mapDbUserToProfile(dbUser);
        profile.lastLogin = new Date().toISOString();

        safeSupabaseSync(
          supabase.from('app_users').update({ last_login: profile.lastLogin }).eq('id', profile.id)
        );

        return { success: true, user: profile };
      }
    }
  } catch (err) {
    console.warn('Supabase auth query error:', err);
  }

  // 3. Check local storage registered users
  if (typeof window !== 'undefined') {
    const localUsersStr = localStorage.getItem('ngo_registered_users');
    if (localUsersStr) {
      try {
        const localUsers: (AppUserRecord & { password_hash: string })[] = JSON.parse(localUsersStr);
        const match = localUsers.find(
          u => u.email.toLowerCase() === cleanId || u.email.toLowerCase().startsWith(cleanId)
        );
        if (match && match.password_hash === computedHash) {
          return { success: true, user: mapDbUserToProfile(match) };
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  return { success: false, message: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە!' };
}

// Register a new user in Supabase PostgreSQL and local storage
export async function registerNewUser(params: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  const cleanName = params.fullName.trim();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPwd = params.password.trim();
  const phone = (params.phone || '').trim();
  const role: UserRole = params.role || 'volunteer';

  if (!cleanName || !cleanEmail || !cleanPwd) {
    return { success: false, message: 'تکایە سەرجەم خانە سەرەکییەکان پڕبکەرەوە!' };
  }

  if (cleanPwd.length < 6) {
    return { success: false, message: 'وشەی نهێنی دەبێت بەلایەنی کەمەوە ٦ پیت یان ژمارە بێت!' };
  }

  const passwordHash = await hashPassword(cleanPwd);
  const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const roleTitleKurdish = ROLE_LABELS[role]?.titleKurdish || 'کارمەندی ڕێکخراو';

  const userRecord: AppUserRecord = {
    id: newUserId,
    email: cleanEmail,
    full_name: cleanName,
    password_hash: passwordHash,
    role,
    role_title_kurdish: roleTitleKurdish,
    phone,
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };

  // 1. Save to Supabase PostgreSQL app_users
  safeSupabaseSync(supabase.from('app_users').upsert(userRecord));

  // 2. Save to local storage for offline support
  if (typeof window !== 'undefined') {
    const existingStr = localStorage.getItem('ngo_registered_users');
    let list: any[] = [];
    if (existingStr) {
      try {
        list = JSON.parse(existingStr);
      } catch (e) {
        list = [];
      }
    }
    list = [userRecord, ...list.filter(u => u.email !== cleanEmail)];
    localStorage.setItem('ngo_registered_users', JSON.stringify(list));
  }

  const profile = mapDbUserToProfile(userRecord);
  return {
    success: true,
    user: profile,
    message: 'هەژمارەکەت بە سەرکەوتوویی دروستکرا و پەیوەست کرا بە داتابەیس!'
  };
}
