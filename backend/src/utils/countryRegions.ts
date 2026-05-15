/**
 * Country to continent/region mapping for broader location matching
 * This allows matching "Africa" opportunities with users in "Kenya", etc.
 */
export const COUNTRY_TO_REGION: Record<string, string[]> = {
  // African countries
  'kenya': ['africa', 'east africa', 'eastern africa'],
  'nigeria': ['africa', 'west africa', 'western africa'],
  'south africa': ['africa', 'southern africa'],
  'egypt': ['africa', 'north africa', 'northern africa', 'middle east'],
  'ghana': ['africa', 'west africa', 'western africa'],
  'ethiopia': ['africa', 'east africa', 'eastern africa'],
  'tanzania': ['africa', 'east africa', 'eastern africa'],
  'uganda': ['africa', 'east africa', 'eastern africa'],
  'morocco': ['africa', 'north africa', 'northern africa'],
  'algeria': ['africa', 'north africa', 'northern africa'],
  'tunisia': ['africa', 'north africa', 'northern africa'],
  'libya': ['africa', 'north africa', 'northern africa'],
  'sudan': ['africa', 'north africa', 'northern africa', 'east africa'],
  'zimbabwe': ['africa', 'southern africa'],
  'zambia': ['africa', 'southern africa'],
  'botswana': ['africa', 'southern africa'],
  'namibia': ['africa', 'southern africa'],
  'mozambique': ['africa', 'southern africa', 'east africa'],
  'madagascar': ['africa', 'east africa', 'eastern africa'],
  'cameroon': ['africa', 'central africa', 'west africa'],
  'ivory coast': ['africa', 'west africa', 'western africa'],
  'senegal': ['africa', 'west africa', 'western africa'],
  'mali': ['africa', 'west africa', 'western africa'],
  'burkina faso': ['africa', 'west africa', 'western africa'],
  'niger': ['africa', 'west africa', 'western africa'],
  'chad': ['africa', 'central africa'],
  'guinea': ['africa', 'west africa', 'western africa'],
  'rwanda': ['africa', 'east africa', 'eastern africa'],
  'benin': ['africa', 'west africa', 'western africa'],
  'burundi': ['africa', 'east africa', 'eastern africa'],
  'togo': ['africa', 'west africa', 'western africa'],
  'sierra leone': ['africa', 'west africa', 'western africa'],
  'central african republic': ['africa', 'central africa'],
  'mauritania': ['africa', 'west africa', 'western africa'],
  'eritrea': ['africa', 'east africa', 'eastern africa'],
  'gambia': ['africa', 'west africa', 'western africa'],
  'guinea-bissau': ['africa', 'west africa', 'western africa'],
  'lesotho': ['africa', 'southern africa'],
  'malawi': ['africa', 'southern africa', 'east africa'],
  'são tomé and príncipe': ['africa', 'central africa'],
  'swaziland': ['africa', 'southern africa'],
  'djibouti': ['africa', 'east africa', 'eastern africa'],
  'comoros': ['africa', 'east africa', 'eastern africa'],
  'cape verde': ['africa', 'west africa', 'western africa'],
  'equatorial guinea': ['africa', 'central africa'],
  'gabon': ['africa', 'central africa'],
  'congo': ['africa', 'central africa'],
  'democratic republic of the congo': ['africa', 'central africa'],
  'angola': ['africa', 'southern africa', 'central africa'],
  'mauritius': ['africa', 'east africa', 'eastern africa'],
  'seychelles': ['africa', 'east africa', 'eastern africa'],
  
  // North American countries
  'canada': ['north america', 'americas'],
  'united states': ['north america', 'americas', 'usa'],
  'united states of america': ['north america', 'americas', 'usa'],
  'usa': ['north america', 'americas'],
  'us': ['north america', 'americas'],
  'mexico': ['north america', 'americas', 'latin america'],
  
  // European countries
  'united kingdom': ['europe', 'european union', 'eu'],
  'uk': ['europe', 'european union', 'eu'],
  'germany': ['europe', 'european union', 'eu'],
  'france': ['europe', 'european union', 'eu'],
  'italy': ['europe', 'european union', 'eu'],
  'spain': ['europe', 'european union', 'eu'],
  'poland': ['europe', 'european union', 'eu'],
  'netherlands': ['europe', 'european union', 'eu'],
  'belgium': ['europe', 'european union', 'eu'],
  'greece': ['europe', 'european union', 'eu'],
  'portugal': ['europe', 'european union', 'eu'],
  'sweden': ['europe', 'european union', 'eu'],
  'norway': ['europe'],
  'denmark': ['europe', 'european union', 'eu'],
  'finland': ['europe', 'european union', 'eu'],
  'ireland': ['europe', 'european union', 'eu'],
  'switzerland': ['europe'],
  'austria': ['europe', 'european union', 'eu'],
  'czech republic': ['europe', 'european union', 'eu'],
  'romania': ['europe', 'european union', 'eu'],
  'hungary': ['europe', 'european union', 'eu'],
  'russia': ['europe', 'asia'],
  
  // Asian countries
  'china': ['asia', 'east asia', 'eastern asia'],
  'india': ['asia', 'south asia', 'southern asia'],
  'japan': ['asia', 'east asia', 'eastern asia'],
  'south korea': ['asia', 'east asia', 'eastern asia'],
  'indonesia': ['asia', 'southeast asia', 'south east asia'],
  'thailand': ['asia', 'southeast asia', 'south east asia'],
  'vietnam': ['asia', 'southeast asia', 'south east asia'],
  'philippines': ['asia', 'southeast asia', 'south east asia'],
  'malaysia': ['asia', 'southeast asia', 'south east asia'],
  'singapore': ['asia', 'southeast asia', 'south east asia'],
  'pakistan': ['asia', 'south asia', 'southern asia'],
  'bangladesh': ['asia', 'south asia', 'southern asia'],
  'sri lanka': ['asia', 'south asia', 'southern asia'],
  'nepal': ['asia', 'south asia', 'southern asia'],
  'afghanistan': ['asia', 'south asia', 'southern asia', 'middle east'],
  'iran': ['asia', 'middle east'],
  'iraq': ['asia', 'middle east'],
  'saudi arabia': ['asia', 'middle east'],
  'israel': ['asia', 'middle east'],
  'turkey': ['asia', 'europe', 'middle east'],
  'uae': ['asia', 'middle east'],
  'united arab emirates': ['asia', 'middle east'],
  
  // South American countries
  'brazil': ['south america', 'americas', 'latin america'],
  'argentina': ['south america', 'americas', 'latin america'],
  'colombia': ['south america', 'americas', 'latin america'],
  'chile': ['south america', 'americas', 'latin america'],
  'peru': ['south america', 'americas', 'latin america'],
  'venezuela': ['south america', 'americas', 'latin america'],
  'ecuador': ['south america', 'americas', 'latin america'],
  'bolivia': ['south america', 'americas', 'latin america'],
  'paraguay': ['south america', 'americas', 'latin america'],
  'uruguay': ['south america', 'americas', 'latin america'],
  'guyana': ['south america', 'americas'],
  'suriname': ['south america', 'americas'],
  'french guiana': ['south america', 'americas'],
  
  // Oceania
  'australia': ['oceania', 'australia and oceania'],
  'new zealand': ['oceania', 'australia and oceania'],
  'fiji': ['oceania', 'australia and oceania'],
  'papua new guinea': ['oceania', 'australia and oceania'],
};

/**
 * Get regions for a country (normalized)
 * @param country - Country name (case-insensitive)
 * @returns Array of regions that include this country
 */
export function getRegionsForCountry(country: string): string[] {
  const normalizedCountry = country.toLowerCase().trim();
  return COUNTRY_TO_REGION[normalizedCountry] || [];
}



