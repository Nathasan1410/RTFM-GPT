
export async function braveSearch(query: string, count: number = 3, apiKeyOverride?: string) {
  const apiKey = apiKeyOverride || process.env.BRAVE_SEARCH_API_KEY || 'BSA0x2UnofOponc-8UKXKHVsxLSb3bm';

  if (!apiKey) {
    console.warn('Brave Search API Key missing');
    return [];
  }

  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', count.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Brave Search API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.web?.results?.map((result: any) => ({
      title: result.title,
      url: result.url,
      description: result.description,
    })) || [];

  } catch (error) {
    console.error('Brave Search Failed:', error);
    return [];
  }
}
