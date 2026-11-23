const TILE_STYLES = { dark: 'dark_all', light: 'light_all' } as const;

export type MapTheme = keyof typeof TILE_STYLES;

export const tileUrl = (theme: MapTheme, key: string | null) =>
  `https://basemaps.cartocdn.com/rastertiles/${TILE_STYLES[theme]}/{z}/{x}/{y}{r}.png` + (key ? `?key=${encodeURIComponent(key)}` : '');

export const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const PRIMARY = '#ef233c';