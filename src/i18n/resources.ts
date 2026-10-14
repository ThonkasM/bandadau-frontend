import { resources as sharedResources } from '@bandada/i18n';

import enApp from '../../locales/en/app.json';
import enAuth from '../../locales/en/auth.json';
import enComments from '../../locales/en/comments.json';
import enCreate from '../../locales/en/create.json';
import enEvents from '../../locales/en/events.json';
import enFeed from '../../locales/en/feed.json';
import enGroups from '../../locales/en/groups.json';
import enNav from '../../locales/en/nav.json';
import enNotifications from '../../locales/en/notifications.json';
import enProfile from '../../locales/en/profile.json';
import enScan from '../../locales/en/scan.json';
import enTickets from '../../locales/en/tickets.json';
import enWallet from '../../locales/en/wallet.json';
import esApp from '../../locales/es/app.json';
import esAuth from '../../locales/es/auth.json';
import esComments from '../../locales/es/comments.json';
import esCreate from '../../locales/es/create.json';
import esEvents from '../../locales/es/events.json';
import esFeed from '../../locales/es/feed.json';
import esGroups from '../../locales/es/groups.json';
import esNav from '../../locales/es/nav.json';
import esNotifications from '../../locales/es/notifications.json';
import esProfile from '../../locales/es/profile.json';
import esScan from '../../locales/es/scan.json';
import esTickets from '../../locales/es/tickets.json';
import esWallet from '../../locales/es/wallet.json';

const appResources = {
  es: {
    app: esApp,
    auth: esAuth,
    nav: esNav,
    feed: esFeed,
    comments: esComments,
    notifications: esNotifications,
    profile: esProfile,
    events: esEvents,
    wallet: esWallet,
    tickets: esTickets,
    groups: esGroups,
    create: esCreate,
    scan: esScan,
  },
  en: {
    app: enApp,
    auth: enAuth,
    nav: enNav,
    feed: enFeed,
    comments: enComments,
    notifications: enNotifications,
    profile: enProfile,
    events: enEvents,
    wallet: enWallet,
    tickets: enTickets,
    groups: enGroups,
    create: enCreate,
    scan: enScan,
  },
} as const;

/** App namespaces merged over the shared `common`/`enums`/`errors` catalogs. */
export const resources = {
  es: { ...sharedResources.es, ...appResources.es },
  en: { ...sharedResources.en, ...appResources.en },
} as const;
