const METRIC_KEYS = ['views', 'likes', 'replies', 'reposts', 'quotes', 'bookmarks'] as const;
type MetricKey = typeof METRIC_KEYS[number];
export type MetricValues = Record<MetricKey, number | null>;
type UnknownRecord = Record<string, unknown>;

export interface ProviderAdapter {
  normalize(payload: unknown): MetricValues;
}

const recordOrEmpty = (value: unknown): UnknownRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : {}
);

export const numberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalize = (values: UnknownRecord): MetricValues => Object.fromEntries(
  METRIC_KEYS.map((key) => [key, numberOrNull(values?.[key])]),
) as MetricValues;

// Provider adapters own payload-shape knowledge. Adding an Actor must not change
// snapshot persistence or silently turn an absent metric into zero.
export const providerAdapters: Record<string, ProviderAdapter> = {
  apify_flat_v1: {
    normalize(payload: unknown): MetricValues {
      return normalize(recordOrEmpty(payload));
    },
  },
  apify_tweet_stats_v1: {
    normalize(payload: unknown): MetricValues {
      const root = recordOrEmpty(payload);
      const tweet = recordOrEmpty(root.tweet);
      const stats = recordOrEmpty(tweet.stats);
      return normalize({
        views: stats.viewCount,
        likes: stats.favoriteCount,
        replies: stats.replyCount,
        reposts: stats.retweetCount,
        quotes: stats.quoteCount,
        bookmarks: stats.bookmarkCount,
      });
    },
  },
  twstalker_v1: {
    normalize(payload: unknown): MetricValues {
      const root = recordOrEmpty(payload);
      const engagement = recordOrEmpty(root.engagement);
      return normalize({
        views: root.impressions,
        likes: engagement.likes,
        replies: engagement.replies,
        reposts: engagement.reposts,
        quotes: engagement.quotes,
        bookmarks: engagement.bookmarks,
      });
    },
  },
  mock_v1: {
    normalize(payload: unknown): MetricValues {
      return normalize(recordOrEmpty(payload));
    },
  },
};

export function normalizeProviderPayload(adapterName: string, payload: unknown): MetricValues {
  const adapter = providerAdapters[adapterName];
  if (!adapter) throw new Error(`Unsupported metrics provider adapter: ${adapterName}`);
  return adapter.normalize(payload);
}
