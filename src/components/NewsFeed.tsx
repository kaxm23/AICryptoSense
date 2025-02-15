import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight, RefreshCcw, Download, Bell } from 'lucide-react';
import type { NewsItem } from '../types';

interface NewsFeedProps {
  news: NewsItem[];
  loading: boolean;
  newsFilter: string;
  setNewsFilter: (filter: string) => void;
}

export default function NewsFeed({ news, loading, newsFilter, setNewsFilter }: NewsFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'impact' | 'reliability'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertKeywords, setAlertKeywords] = useState<string[]>([]);
  const itemsPerPage = 8;

  const handleSort = (newSortBy: 'date' | 'impact' | 'reliability') => {
    if (sortBy === newSortBy) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedNews = React.useMemo(() => {
    return news
      .filter(item => {
        const matchesFilter = newsFilter === 'all' ||
          (newsFilter === 'verified' && item.reliability && item.reliability > 90) ||
          (newsFilter === 'high-impact' && item.impact === 'High');

        const matchesSearch = searchQuery === '' ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.body.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'date':
            comparison = b.published_on - a.published_on;
            break;
          case 'impact':
            const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            comparison = (impactOrder[b.impact as keyof typeof impactOrder] || 0) -
                        (impactOrder[a.impact as keyof typeof impactOrder] || 0);
            break;
          case 'reliability':
            comparison = (b.reliability || 0) - (a.reliability || 0);
            break;
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });
  }, [news, newsFilter, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNews = filteredAndSortedNews.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Export functionality
  const exportData = useCallback(() => {
    const exportableData = filteredAndSortedNews.map(item => ({
      title: item.title,
      source: item.source,
      published: new Date(item.published_on * 1000).toISOString(),
      sentiment: item.sentiment,
      reliability: item.reliability,
      impact: item.impact
    }));

    const blob = new Blob([JSON.stringify(exportableData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-news-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredAndSortedNews]);

  // Alert system
  const checkForAlerts = useCallback((newsItems: NewsItem[]) => {
    if (alertKeywords.length === 0) return;

    const newAlerts = newsItems.filter(item => 
      alertKeywords.some(keyword => 
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        item.body.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (newAlerts.length > 0) {
      // Check if notification API is available and permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        newAlerts.forEach(alert => {
          new Notification('Crypto News Alert', {
            body: alert.title,
            icon: '/favicon.ico'
          });
        });
      }
    }
  }, [alertKeywords]);

  useEffect(() => {
    checkForAlerts(news);
  }, [news, checkForAlerts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [newsFilter, searchQuery, sortBy, sortOrder]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-3 sm:p-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-xl font-bold flex items-center">
            <Newspaper className="h-4 sm:h-5 w-4 sm:w-5 mr-2 text-blue-400" />
            Recent News Analysis
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAlertModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Alerts
            </button>
            <button
              onClick={exportData}
              className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-3 py-1.5 text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <Newspaper className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs sm:text-sm"
              value={newsFilter}
              onChange={(e) => setNewsFilter(e.target.value)}
            >
              <option value="all">All News</option>
              <option value="verified">Verified Only</option>
              <option value="high-impact">High Impact</option>
            </select>
            <div className="flex rounded-lg overflow-hidden border border-gray-600">
              <button
                onClick={() => handleSort('date')}
                className={`px-2 py-1.5 text-xs sm:text-sm ${
                  sortBy === 'date' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSort('impact')}
                className={`px-2 py-1.5 text-xs sm:text-sm border-l border-gray-600 ${
                  sortBy === 'impact' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Impact {sortBy === 'impact' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSort('reliability')}
                className={`px-2 py-1.5 text-xs sm:text-sm border-l border-gray-600 ${
                  sortBy === 'reliability' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Reliability {sortBy === 'reliability' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading && news.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <RefreshCcw className="h-6 sm:h-8 w-6 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-blue-400" />
              <p className="text-gray-400 text-sm">Loading news...</p>
            </div>
          ) : filteredAndSortedNews.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <AlertTriangle className="h-6 sm:h-8 w-6 sm:w-8 mx-auto mb-3 sm:mb-4 text-yellow-400" />
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'No news matches your search.' : `No ${newsFilter === 'verified' ? 'verified' : newsFilter === 'high-impact' ? 'high-impact' : ''} news available.`}
              </p>
            </div>
          ) : (
            <>
              {currentNews.map((newsItem, index) => (
                <div key={newsItem.id || index} className="border-b border-gray-700 last:border-0 pb-4 last:pb-0">
                  <div className="space-y-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base mb-2">
                        {newsItem.title}
                        {(newsItem.reliability && newsItem.reliability > 90) && (
                          <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Verified</span>
                        )}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm mb-2 line-clamp-2">
                        {newsItem.body}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-gray-400">Source: {newsItem.source}</span>
                          <span className="text-gray-400">
                            {new Date(newsItem.published_on * 1000).toLocaleString()}
                          </span>
                        </div>
                        <a
                          href={newsItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Read More <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-700/30 rounded-lg p-2">
                      <div>
                        <p className="text-gray-400 mb-0.5">Reliability</p>
                        <p className="font-semibold text-green-400">{newsItem.reliability}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Sentiment</p>
                        <p className="font-semibold text-blue-400">{newsItem.sentiment}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-0.5">Impact</p>
                        <p className="font-semibold text-purple-400">{newsItem.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-6 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-lg bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">News Alerts</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Add keywords to track (press Enter to add)
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        setAlertKeywords(prev => [...prev, input.value.trim()]);
                        input.value = '';
                      }
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {alertKeywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs"
                  >
                    {keyword}
                    <button
                      onClick={() => setAlertKeywords(prev => prev.filter((_, i) => i !== index))}
                      className="ml-1.5 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}