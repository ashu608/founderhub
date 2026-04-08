// src/hooks/index.js (Consolidated Hooks)

import { useEffect, useRef } from "react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import * as api from "@/api/index";
import { useAuthStore } from "@/store/auth.store";

// ==========================================
// IDEAS
// ==========================================
export const useIdeas = (filters = {}) =>
  useInfiniteQuery({
    queryKey: ["ideas", filters],
    queryFn:  ({ pageParam = 1 }) => api.getIdeas({ ...filters, page: pageParam, limit: 10 }),
    getNextPageParam: (last) => last.page < last.pages ? last.page + 1 : undefined,
    staleTime: 30_000,
  });

export const useIdeaDetail = (id) =>
  useQuery({
    queryKey: ["idea", id],
    queryFn:  () => api.getIdea(id),
    enabled:  !!id,
  });

export const useVote = (ideaId) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (direction) => api.voteIdea(ideaId, direction),
    onMutate: async (direction) => {
      await qc.cancelQueries({ queryKey: ["idea", ideaId] });
      const prev = qc.getQueryData(["idea", ideaId]);
      qc.setQueryData(["idea", ideaId], old => old ? {
        ...old,
        upvotes:   direction === 1  ? old.upvotes + 1   : Math.max(0, old.upvotes - (old.userVote === 1 ? 1 : 0)),
        downvotes: direction === -1 ? old.downvotes + 1 : Math.max(0, old.downvotes - (old.userVote === -1 ? 1 : 0)),
        userVote:  direction,
      } : old);
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(["idea", ideaId], ctx.prev);
      toast.error("Vote failed. Please try again.");
    },
    onSuccess: (data) => {
      qc.setQueryData(["idea", ideaId], old => old ? { ...old, ...data } : old);
      qc.invalidateQueries({ queryKey: ["ideas"] });
    },
  });
};

export const useWTP = (ideaId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bucket) => api.wtpVote(ideaId, bucket),
    onSuccess: (data) => {
      qc.setQueryData(["idea", ideaId], old => old ? { ...old, ...data } : old);
      toast.success("Willingness-to-pay vote recorded!");
    },
    onError: () => toast.error("Failed to submit vote."),
  });
};

// ==========================================
// COMMENTS
// ==========================================
export const useComments = (ideaId, sort = "newest") =>
  useQuery({
    queryKey: ["comments", ideaId, sort],
    queryFn:  () => api.getComments(ideaId, { sort }),
    enabled:  !!ideaId,
  });

export const useAddComment = (ideaId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.addComment(ideaId, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["comments", ideaId] }); toast.success("Comment posted!"); },
    onError:    () => toast.error("Failed to post comment."),
  });
};

// ==========================================
// PROJECTS
// ==========================================
export const useProjects = (params) =>
  useQuery({ queryKey: ["projects", params], queryFn: () => api.getProjects(params) });

export const useProject = (id) =>
  useQuery({ queryKey: ["project", id], queryFn: () => api.getProject(id), enabled: !!id });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createProject,
    onSuccess:  (data) => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project tracker created! 🚀"); return data; },
    onError:    () => toast.error("Failed to create project."),
  });
};

export const useLogMilestone = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.logMilestone(projectId, data),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["project", projectId] }); toast.success("Milestone logged! Keep going 🔥"); },
    onError:    () => toast.error("Failed to log milestone."),
  });
};

// ==========================================
// BATTLES
// ==========================================
export const useBattles = () =>
  useQuery({ queryKey: ["battles", "active"], queryFn: api.getActiveBattles, refetchInterval: 30_000 });

export const useVoteBattle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, picked }) => api.voteBattle(id, picked),
    onSuccess:  (data, { id }) => {
      qc.setQueryData(["battles", "active"], old =>
        old?.map(b => b._id === id ? { ...b, ...data, userPicked: data.userPicked } : b)
      );
      toast.success("Vote cast! ⚔️");
    },
    onError: () => toast.error("Failed to cast vote."),
  });
};

// ==========================================
// LEADERBOARD
// ==========================================
export const useLeaderboardIdeas    = () => useQuery({ queryKey: ["lb","ideas"],    queryFn: api.getTopIdeas });
export const useLeaderboardBuilders = () => useQuery({ queryKey: ["lb","builders"], queryFn: api.getTopBuilders });
export const useLeaderboardGrowing  = () => useQuery({ queryKey: ["lb","growing"],  queryFn: api.getTopGrowing });

// ==========================================
// PROFILE
// ==========================================
export const useProfile = (username) =>
  useQuery({ queryKey: ["user", username], queryFn: () => api.getUser(username), enabled: !!username });

export const useFollowUser = (username) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.followUser(id),
    onSuccess:  (data) => {
      qc.setQueryData(["user", username], old => old ? { ...old, isFollowing: data.following, followersCount: old.followersCount + (data.following ? 1 : -1) } : old);
      toast.success(data.following ? "Following!" : "Unfollowed.");
    },
  });
};

// ==========================================
// UTILS
// ==========================================
export const useInfiniteScroll = (fetchNextPage, hasNextPage) => {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) fetchNextPage();
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return sentinelRef;
};

// ==========================================
// AUTH
// ==========================================
export const useLogin = () => {
  const login = useAuthStore(s => s.login);
  return useMutation({
    mutationFn: api.login,
    onSuccess:  ({ token, user }) => { login(token, user); toast.success(`Welcome back, ${user.name.split(" ")[0]}!`); },
    onError:    (e) => toast.error(e.response?.data?.error || "Login failed."),
  });
};

export const useRegister = () => {
  const login = useAuthStore(s => s.login);
  return useMutation({
    mutationFn: api.register,
    onSuccess:  ({ token, user }) => { login(token, user); toast.success("Account created! Welcome to FounderHub 🚀"); },
    onError:    (e) => toast.error(e.response?.data?.error || "Registration failed."),
  });
};