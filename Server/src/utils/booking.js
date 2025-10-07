export const isWithin1Hour = (createdAt) => {
  const now = new Date();
  const diffMs = now - new Date(createdAt);
  return diffMs <= 60 * 60 * 1000; // 1 tiếng
};
