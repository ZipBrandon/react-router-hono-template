import { useMatches, useNavigation } from "react-router";

import { Route } from "../+types.root";

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export const isValidTheme = (theme: any): theme is Theme => theme && Object.values(Theme).includes(theme);

export const useTheme = (): Theme => {
  const theme = useNavigation().formData?.get("theme") || (useMatches()?.[0]?.data as Route.LoaderData)?.theme;
  return isValidTheme(theme) ? theme : Theme.DARK;
};
