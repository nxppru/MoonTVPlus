export interface AnimeSubscription {
  id: string;
  title: string;
  filterText: string;
  source: 'acgrip' | 'mikan' | 'dmhy' | 'nyaa';
  enabled: boolean;
  lastCheckTime: number;
  lastEpisode: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export type AnimeSubscriptionDownloadTool = 'aria2' | 'qBittorrent' | 'Transmission';

export interface AnimeSubscriptionConfig {
  Enabled: boolean;
  DownloadTool?: AnimeSubscriptionDownloadTool;
  Subscriptions: AnimeSubscription[];
}
