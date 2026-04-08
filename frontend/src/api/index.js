// src/api/auth.api.js
import client from "./client";
export const register  = (d)  => client.post("/auth/register", d).then(r => r.data);
export const login     = (d)  => client.post("/auth/login", d).then(r => r.data);
export const loginGoogle = (idToken) => client.post("/auth/google", { idToken }).then(r => r.data);
export const getMe     = ()   => client.get("/auth/me").then(r => r.data);
export const refresh   = ()   => client.post("/auth/refresh").then(r => r.data);

// src/api/ideas.api.js
export const getIdeas   = (p) => client.get("/ideas", { params: p }).then(r => r.data);
export const getIdea    = (id) => client.get(`/ideas/${id}`).then(r => r.data);
export const createIdea = (d)  => client.post("/ideas", d).then(r => r.data);
export const updateIdea = (id, d) => client.patch(`/ideas/${id}`, d).then(r => r.data);
export const deleteIdea = (id)    => client.delete(`/ideas/${id}`).then(r => r.data);
export const voteIdea   = (id, direction) => client.post(`/ideas/${id}/vote`, { direction }).then(r => r.data);
export const wtpVote    = (id, bucket)    => client.post(`/ideas/${id}/wtp`, { bucket }).then(r => r.data);
export const watchIdea  = (id)            => client.post(`/ideas/${id}/watch`).then(r => r.data);

// src/api/comments.api.js
export const getComments   = (ideaId, p) => client.get(`/ideas/${ideaId}/comments`, { params: p }).then(r => r.data);
export const addComment    = (ideaId, d) => client.post(`/ideas/${ideaId}/comments`, d).then(r => r.data);
export const upvoteComment = (ideaId, commentId) => client.post(`/ideas/${ideaId}/comments/${commentId}/upvote`).then(r => r.data);
export const deleteComment = (ideaId, commentId) => client.delete(`/ideas/${ideaId}/comments/${commentId}`).then(r => r.data);

// src/api/projects.api.js
export const getProjects       = (p)      => client.get("/projects", { params: p }).then(r => r.data);
export const getProject        = (id)     => client.get(`/projects/${id}`).then(r => r.data);
export const createProject     = (d)      => client.post("/projects", d).then(r => r.data);
export const updateProject     = (id, d)  => client.patch(`/projects/${id}`, d).then(r => r.data);
export const logMilestone      = (id, d)  => client.post(`/projects/${id}/milestones`, d).then(r => r.data);
export const watchProject      = (id)     => client.post(`/projects/${id}/watch`).then(r => r.data);

// src/api/battles.api.js
export const getActiveBattles  = ()       => client.get("/battles/active").then(r => r.data);
export const getBattleHistory  = ()       => client.get("/battles/history").then(r => r.data);
export const voteBattle        = (id, picked) => client.post(`/battles/${id}/vote`, { picked }).then(r => r.data);

// src/api/users.api.js
export const getUser     = (username) => client.get(`/users/${username}`).then(r => r.data);
export const updateMe    = (d)        => client.patch("/users/me", d).then(r => r.data);
export const uploadAvatar= (file)     => { const f = new FormData(); f.append("avatar", file); return client.post("/users/me/avatar", f).then(r => r.data); };
export const followUser  = (id)       => client.post(`/users/${id}/follow`).then(r => r.data);
export const getFollowers= (id)       => client.get(`/users/${id}/followers`).then(r => r.data);
export const getFollowing= (id)       => client.get(`/users/${id}/following`).then(r => r.data);

// src/api/leaderboard.api.js
export const getTopIdeas    = () => client.get("/leaderboard/ideas").then(r => r.data);
export const getTopBuilders = () => client.get("/leaderboard/builders").then(r => r.data);
export const getTopGrowing  = () => client.get("/leaderboard/growing").then(r => r.data);

// src/api/notifications.api.js
export const getNotifs     = () => client.get("/notifications").then(r => r.data);
export const getUnreadCount= () => client.get("/notifications/unread-count").then(r => r.data);
export const markAllRead   = () => client.patch("/notifications/read-all").then(r => r.data);

// src/api/search.api.js
export const search = (q, type) => client.get("/search", { params: { q, type } }).then(r => r.data);