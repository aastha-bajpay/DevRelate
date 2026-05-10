export type Platform = 'discord' | 'github' | 'stackoverflow' | 'reddit';

export interface Question {
  id: string;
  platform: Platform;
  user: string;
  content: string;
  status: 'pending' | 'auto-resolved' | 'human-review';
  timestamp: string;
  ai_response?: string;
  pr_drafted?: boolean;
}

export interface Contributor {
  name: string;
  points: number;
  interactions: number;
}

export interface ApifyMention {
  id: string;
  source: 'reddit' | 'stackoverflow';
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
  timestamp: string;
}

export interface DashboardData {
  stats: {
    openQuestions: number;
    resolvedLast24h: number;
    avgResponseTime: string;
    sentiment: string;
  };
  questions: Question[];
  contributors: Contributor[];
  scrapedMentions: ApifyMention[];
  infrastructure: {
    provider: 'Superplane';
    status: 'healthy' | 'warning' | 'down';
    webhooks: {
      discord: boolean;
      github: boolean;
    };
  };
}
