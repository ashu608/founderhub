// backend/utils/scoring.js
const recalcValidationScore = (idea) => {
  const total        = idea.upvotes + idea.downvotes + 1;
  const upvoteRatio  = idea.upvotes / total;
  const willPayRate  = (idea.willPayRate || 0) / 100;
  const engagement   = Math.min((idea.commentCount || 0) / 50, 1);
  const ageDays      = (Date.now() - new Date(idea.createdAt)) / 86_400_000;
  const recencyBonus = ageDays < 7 ? 5 : 0;
  return Math.min(Math.round((upvoteRatio * 40) + (willPayRate * 40) + (engagement * 20) + recencyBonus), 100);
};

module.exports = { recalcValidationScore };