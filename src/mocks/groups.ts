import type { GroupPage } from '@/features/groups/types';

const NOW = new Date().toISOString();

export function mockGroups(): GroupPage {
  return {
    items: [
      {
        id: '0192f3f0-0000-7000-8000-000000000001',
        ownerId: '0192f3b0-0000-7000-8000-000000000002',
        name: 'ISW-II · Grupo de estudio',
        subject: 'Ingeniería de Software II',
        privacy: 'PUBLIC',
        membersCount: 24,
        myMembership: null,
        createdAt: NOW,
      },
      {
        id: '0192f3f0-0000-7000-8000-000000000002',
        ownerId: '0192f3b0-0000-7000-8000-000000000003',
        name: 'Álgebra lineal',
        subject: 'Matemáticas',
        privacy: 'PUBLIC',
        membersCount: 58,
        myMembership: { role: 'MEMBER', status: 'ACTIVE' },
        createdAt: NOW,
      },
      {
        id: '0192f3f0-0000-7000-8000-000000000003',
        ownerId: '0192f3b0-0000-7000-8000-000000000001',
        name: 'Arquitectura y patrones',
        subject: 'Software',
        privacy: 'PRIVATE',
        membersCount: 12,
        myMembership: { role: 'OWNER', status: 'ACTIVE' },
        createdAt: NOW,
      },
    ],
    nextCursor: null,
  };
}
