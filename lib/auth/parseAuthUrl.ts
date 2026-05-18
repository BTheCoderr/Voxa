/**
 * Parse query string + hash fragment from a deep link URL (Supabase puts tokens in the hash for implicit flow).
 */
export function parseAuthParamsFromUrl(url: string): Record<string, string> {
  const out: Record<string, string> = {};

  const decode = (s: string) => {
    try {
      return decodeURIComponent(s.replace(/\+/g, ' '));
    } catch {
      return s;
    }
  };

  const addSegment = (segment: string) => {
    if (!segment) return;
    for (const pair of segment.split('&')) {
      if (!pair) continue;
      const eq = pair.indexOf('=');
      if (eq === -1) {
        out[decode(pair)] = '';
        continue;
      }
      const key = decode(pair.slice(0, eq));
      const val = decode(pair.slice(eq + 1));
      out[key] = val;
    }
  };

  const hashIdx = url.indexOf('#');
  const beforeHash = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const hash = hashIdx >= 0 ? url.slice(hashIdx + 1) : '';

  const qIdx = beforeHash.indexOf('?');
  const query = qIdx >= 0 ? beforeHash.slice(qIdx + 1) : '';

  addSegment(query);
  addSegment(hash);

  return out;
}
