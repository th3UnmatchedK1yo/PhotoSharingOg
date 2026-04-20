import type { ProjectSummary } from "./project";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export type PublicProfile = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type FriendshipRow = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
};

export type FriendRequestItem = {
  friendshipId: string;
  requesterId: string;
  requester: PublicProfile | null;
  createdAt: string;
};

export type OutgoingFriendRequestItem = {
  friendshipId: string;
  addresseeId: string;
  addressee: PublicProfile | null;
  createdAt: string;
};

export type FriendItem = {
  friendshipId: string;
  userId: string;
  user: PublicProfile | null;
};

export type SharedProjectFeedItem = {
  id: string;
  ownerId: string;
  projectId: string;
  caption: string;
  createdAt: string;
  owner: PublicProfile | null;
  project: ProjectSummary;
};