import { resources as sharedResources } from '@bandada/i18n';

import enApp from '../../locales/en/app.json';
import enAuth from '../../locales/en/auth.json';
import enFeed from '../../locales/en/feed.json';
import enNav from '../../locales/en/nav.json';
import enNotifications from '../../locales/en/notifications.json';
import enProfile from '../../locales/en/profile.json';
import esApp from '../../locales/es/app.json';
import esAuth from '../../locales/es/auth.json';
import esFeed from '../../locales/es/feed.json';
import esNav from '../../locales/es/nav.json';
import esNotifications from '../../locales/es/notifications.json';
import esProfile from '../../locales/es/profile.json';

const appResources = {
  es: { app: esApp, auth: esAuth, nav: esNav, feed: esFeed, notifications: esNotifications, profile: esProfile },
  en: { app: enApp, auth: enAuth, nav: enNav, feed: enFeed, notifications: enNotifications, profile: enProfile },
} as const;

/** App namespaces merged over the shared `common`/`enums`/`errors` catalogs. */
export const resources = {
  es: { ...sharedResources.es, ...appResources.es },
  en: { ...sharedResources.en, ...appResources.en },
} as const;
