export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  published_on: number;
  imageurl: string;
  body: string;
  sentiment?: string;
  reliability?: number;
  impact?: 'High' | 'Medium' | 'Low';
  votes?: {
    positive: number;
    negative: number;
  };
}