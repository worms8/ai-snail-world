import sk from './i18n/sk.json';

/** UI strings live here, never inline in components. Add a locale = add a JSON file. */
export const LOCALES = { sk } as const;

export type LocaleId = keyof typeof LOCALES;
export type UiStringKey = keyof typeof sk;

export const DEFAULT_LOCALE: LocaleId = 'sk';

export function uiString(locale: LocaleId, key: UiStringKey): string {
  return LOCALES[locale][key];
}
