export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const isExpired = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

export const isExpiringSoon = (dateStr, days = 30) => {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return expiry > new Date() && expiry <= cutoff;
};

export const daysUntilExpiry = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
