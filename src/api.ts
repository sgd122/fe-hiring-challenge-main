import type { ContentItem } from './types';

const API_URL = 'https://closet-recruiting-api.azurewebsites.net/api/data';

export const fetchContents = async (): Promise<ContentItem[]> => {
  const response = await fetch(API_URL);
  const data: ContentItem[] = await response.json();
  return data;
};
