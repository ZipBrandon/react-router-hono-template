import { useMatches, useNavigation } from "react-router";

import { ClientLoaderArgs } from ".react-router/types/app/+types.root";

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export const isValidTheme = (theme: any): theme is Theme => theme && Object.values(Theme).includes(theme);

export const useTheme = (): Theme => {
  const theme = useNavigation().formData?.get("theme") || (useMatches()?.[0]?.data as Awaited<ReturnType<ClientLoaderArgs["serverLoader"]>>)?.theme;
  return isValidTheme(theme) ? theme : Theme.DARK;
};
