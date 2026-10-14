import type { Profile } from '@/features/profile/types';

const PROFILE: Profile = {
  userId: '0192f3b0-0000-7000-8000-000000000001',
  displayName: 'Lucía Pérez',
  avatarUrl: null,
  avatarMediaId: null,
  bio: 'Estudiante de Ingeniería de Software. Amante de los eventos y el café.',
  career: 'Ingeniería de Software',
  semester: 6,
  interests: ['arquitectura', 'eventos', 'grupos de estudio'],
  followersCount: 128,
  followingCount: 96,
  postsCount: 14,
  followedByMe: false,
  universityId: '01927f00-0000-7000-8000-000000000010',
  createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  updatedAt: new Date().toISOString(),
};

/** UC-04 mock. */
export function mockMyProfile(): Profile {
  return PROFILE;
}

export function mockUpdateProfile(): Profile {
  return PROFILE;
}
