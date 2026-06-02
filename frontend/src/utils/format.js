export const formatPrice = (price, decimals = 2) => {
  if (price === null || price === undefined) return '—';
  const p = parseFloat(price);
  if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
};

export const formatCurrency = (val, symbol = '$') =>
  `${symbol}${parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatPercent = (val) => {
  const v = parseFloat(val || 0);
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
};

export const formatVolume = (val) => {
  const v = parseFloat(val || 0);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return v.toFixed(2);
};

export const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false });
};

export const formatDate = (ts) =>
  new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const isPositive = (val) => parseFloat(val || 0) >= 0;

export const cn = (...classes) => classes.filter(Boolean).join(' ');
