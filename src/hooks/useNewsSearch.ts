import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import type { NewsItem } from '../types';

export function useNewsSearch(news: NewsItem[], searchQuery: string, newsFilter: string) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesFilter = newsFilter === 'all' ||
        (newsFilter === 'verified' && item.reliability && item.reliability > 90) ||
        (newsFilter === 'high-impact' && item.impact === 'High');

      const matchesSearch = debouncedSearchQuery === '' ||
        item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [news, debouncedSearchQuery, newsFilter]);

  return filteredNews;
}