import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BottomTabBar from "../../../components/shared/BottomTabBar";
import { COLORS } from "../../../constants/theme";
import { useAuth } from "../../../providers/AuthProvider";
import {
  acceptFriendRequest,
  cancelOutgoingFriendRequest,
  declineFriendRequest,
  getAcceptedFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  getSharedFeed,
  removeFriend,
  searchProfiles,
  sendFriendRequest,
} from "../../../services/social";
import type {
  FriendItem,
  FriendRequestItem,
  OutgoingFriendRequestItem,
  PublicProfile,
  SharedProjectFeedItem,
} from "../../../types/social";

function formatProfileName(profile: PublicProfile | null) {
  if (!profile) return "Unknown";
  return profile.displayName || profile.username || "Unknown";
}

function formatProfileHandle(profile: PublicProfile | null) {
  if (!profile?.username) return "";
  return `@${profile.username}`;
}

function getInitial(profile: PublicProfile | null) {
  const source = profile?.displayName || profile?.username || "U";
  return source.charAt(0).toUpperCase();
}

function ProfileAvatar({
  profile,
  size = 48,
}: {
  profile: PublicProfile | null;
  size?: number;
}) {
  if (profile?.avatarUrl) {
    return (
      <Image
        source={{ uri: profile.avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.backgroundAlt,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: COLORS.primaryText,
          fontWeight: "700",
          fontSize: Math.max(16, size * 0.34),
        }}
      >
        {getInitial(profile)}
      </Text>
    </View>
  );
}

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>(
    [],
  );
  const [outgoingRequests, setOutgoingRequests] = useState<
    OutgoingFriendRequestItem[]
  >([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [feedItems, setFeedItems] = useState<SharedProjectFeedItem[]>([]);

  const loadScreen = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [incoming, outgoing, accepted, feed] = await Promise.all([
        getIncomingFriendRequests(user.id),
        getOutgoingFriendRequests(user.id),
        getAcceptedFriends(user.id),
        getSharedFeed(),
      ]);

      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setFriends(accepted);
      setFeedItems(feed);
    } catch (error) {
      console.log("friends screen load error:", error);
      Alert.alert("Error", "Failed to load friends data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadScreen();
    }, [loadScreen]),
  );

  const incomingByUserId = useMemo(() => {
    const map = new Map<string, FriendRequestItem>();
    for (const item of incomingRequests) {
      map.set(item.requesterId, item);
    }
    return map;
  }, [incomingRequests]);

  const outgoingByUserId = useMemo(() => {
    const map = new Map<string, OutgoingFriendRequestItem>();
    for (const item of outgoingRequests) {
      map.set(item.addresseeId, item);
    }
    return map;
  }, [outgoingRequests]);

  const friendIds = useMemo(
    () => new Set(friends.map((item) => item.userId)),
    [friends],
  );

  const friendByUserId = useMemo(() => {
    const map = new Map<string, FriendItem>();
    for (const item of friends) {
      map.set(item.userId, item);
    }
    return map;
  }, [friends]);

  const onSearch = async () => {
    try {
      setSearching(true);
      setHasSearched(true);
      const results = await searchProfiles(searchText);
      setSearchResults(results);
    } catch (error) {
      console.log("search profiles error:", error);
      Alert.alert("Error", "Failed to search users.");
    } finally {
      setSearching(false);
    }
  };

  const onSendRequest = async (profile: PublicProfile) => {
    if (!user) return;

    try {
      await sendFriendRequest(user.id, profile.id);
      await loadScreen();
      Alert.alert("Done", "Friend request sent.");
    } catch (error: any) {
      console.log("sendFriendRequest error:", error);
      Alert.alert("Error", error?.message || "Failed to send request.");
    }
  };

  const onAcceptRequest = async (friendshipId: string) => {
    if (!user) return;

    try {
      await acceptFriendRequest(friendshipId);
      await loadScreen();
    } catch (error) {
      console.log("acceptFriendRequest error:", error);
      Alert.alert("Error", "Failed to accept friend request.");
    }
  };

  const onDeclineRequest = async (friendshipId: string) => {
    if (!user) return;

    try {
      await declineFriendRequest(friendshipId);
      await loadScreen();
    } catch (error) {
      console.log("declineFriendRequest error:", error);
      Alert.alert("Error", "Failed to decline friend request.");
    }
  };

  const onCancelOutgoing = async (friendshipId: string) => {
    if (!user) return;

    try {
      await cancelOutgoingFriendRequest(friendshipId);
      await loadScreen();
    } catch (error) {
      console.log("cancelOutgoingFriendRequest error:", error);
      Alert.alert("Error", "Failed to cancel request.");
    }
  };

  const onRemoveFriend = (friendshipId: string, name: string) => {
    if (!user) return;

    Alert.alert("Unfriend", `Remove ${name} from your friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unfriend",
        style: "destructive",
        onPress: async () => {
          try {
            await removeFriend(friendshipId);
            await loadScreen();
          } catch (error) {
            console.log("removeFriend error:", error);
            Alert.alert("Error", "Failed to unfriend.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Friends</Text>
            <Text style={styles.headerSubtitle}>
              Build a private scrapbook circle and see what friends share.
            </Text>
          </View>

          <Pressable style={styles.refreshPill} onPress={loadScreen}>
            <Text style={styles.refreshPillText}>Refresh</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Find people</Text>

          <View style={styles.searchRow}>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by username or display name"
              placeholderTextColor={COLORS.placeholder}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={onSearch}
            />

            <Pressable style={styles.primaryButton} onPress={onSearch}>
              <Text style={styles.primaryButtonText}>
                {searching ? "..." : "Search"}
              </Text>
            </Pressable>
          </View>

          {hasSearched && searchResults.length === 0 && !searching && (
            <Text style={styles.emptySearchText}>
              No users found for that search yet.
            </Text>
          )}

          {searchResults.length > 0 && (
            <View style={styles.resultList}>
              {searchResults.map((profile) => {
                const isFriend = friendIds.has(profile.id);
                const friend = friendByUserId.get(profile.id);
                const incoming = incomingByUserId.get(profile.id);
                const outgoing = outgoingByUserId.get(profile.id);

                return (
                  <View key={profile.id} style={styles.personCard}>
                    <View style={styles.personLeft}>
                      <ProfileAvatar profile={profile} size={52} />

                      <View style={styles.personMeta}>
                        <Text style={styles.personName}>
                          {formatProfileName(profile)}
                        </Text>
                        {!!formatProfileHandle(profile) && (
                          <Text style={styles.personHandle}>
                            {formatProfileHandle(profile)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {isFriend && friend ? (
                      <Pressable
                        style={styles.unfriendButtonSmall}
                        onPress={() =>
                          onRemoveFriend(
                            friend.friendshipId,
                            formatProfileName(profile),
                          )
                        }
                      >
                        <Text style={styles.unfriendButtonText}>Unfriend</Text>
                      </Pressable>
                    ) : incoming ? (
                      <Pressable
                        style={styles.primaryButtonSmall}
                        onPress={() => onAcceptRequest(incoming.friendshipId)}
                      >
                        <Text style={styles.primaryButtonText}>Accept</Text>
                      </Pressable>
                    ) : outgoing ? (
                      <Pressable
                        style={styles.secondaryButtonSmall}
                        onPress={() => onCancelOutgoing(outgoing.friendshipId)}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={styles.primaryButtonSmall}
                        onPress={() => onSendRequest(profile)}
                      >
                        <Text style={styles.primaryButtonText}>Add</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Incoming requests</Text>

          {incomingRequests.length === 0 ? (
            <Text style={styles.emptyText}>No pending requests right now.</Text>
          ) : (
            incomingRequests.map((item) => (
              <View key={item.friendshipId} style={styles.requestCard}>
                <View style={styles.personLeft}>
                  <ProfileAvatar profile={item.requester} size={48} />
                  <View style={styles.personMeta}>
                    <Text style={styles.personName}>
                      {formatProfileName(item.requester)}
                    </Text>
                    {!!formatProfileHandle(item.requester) && (
                      <Text style={styles.personHandle}>
                        {formatProfileHandle(item.requester)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <Pressable
                    style={styles.secondaryButtonSmall}
                    onPress={() => onDeclineRequest(item.friendshipId)}
                  >
                    <Text style={styles.secondaryButtonText}>Decline</Text>
                  </Pressable>

                  <Pressable
                    style={styles.primaryButtonSmall}
                    onPress={() => onAcceptRequest(item.friendshipId)}
                  >
                    <Text style={styles.primaryButtonText}>Accept</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Outgoing requests</Text>

          {outgoingRequests.length === 0 ? (
            <Text style={styles.emptyText}>
              You do not have any outgoing requests.
            </Text>
          ) : (
            outgoingRequests.map((item) => (
              <View key={item.friendshipId} style={styles.requestCard}>
                <View style={styles.personLeft}>
                  <ProfileAvatar profile={item.addressee} size={48} />
                  <View style={styles.personMeta}>
                    <Text style={styles.personName}>
                      {formatProfileName(item.addressee)}
                    </Text>
                    {!!formatProfileHandle(item.addressee) && (
                      <Text style={styles.personHandle}>
                        {formatProfileHandle(item.addressee)}
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  style={styles.secondaryButtonSmall}
                  onPress={() => onCancelOutgoing(item.friendshipId)}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your friends</Text>

          {friends.length === 0 ? (
            <Text style={styles.emptyText}>
              Add a friend first to start your private scrapbook circle.
            </Text>
          ) : (
            <View style={styles.friendList}>
              {friends.map((item) => (
                <View key={item.friendshipId} style={styles.friendRow}>
                  <View style={styles.personLeft}>
                    <ProfileAvatar profile={item.user} size={48} />
                    <View style={styles.personMeta}>
                      <Text style={styles.personName}>
                        {formatProfileName(item.user)}
                      </Text>
                      {!!formatProfileHandle(item.user) && (
                        <Text style={styles.personHandle}>
                          {formatProfileHandle(item.user)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Pressable
                    style={styles.unfriendButtonSmall}
                    onPress={() =>
                      onRemoveFriend(
                        item.friendshipId,
                        formatProfileName(item.user),
                      )
                    }
                  >
                    <Text style={styles.unfriendButtonText}>Unfriend</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Shared by friends</Text>

          {feedItems.length === 0 ? (
            <Text style={styles.emptyText}>
              No shared projects yet. Once friends share scrapbook projects,
              they will appear here.
            </Text>
          ) : (
            feedItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.feedCard}
                onPress={() => router.push(`/friends/shared/${item.id}`)}
              >
                <View style={styles.feedHeader}>
                  <ProfileAvatar profile={item.owner} size={44} />
                  <View style={styles.feedHeaderMeta}>
                    <Text style={styles.feedOwner}>
                      {formatProfileName(item.owner)}
                    </Text>
                    {!!formatProfileHandle(item.owner) && (
                      <Text style={styles.feedHandle}>
                        {formatProfileHandle(item.owner)}
                      </Text>
                    )}
                  </View>

                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={24}
                    color={COLORS.textMuted}
                  />
                </View>

                <Text style={styles.feedProjectName}>{item.project.name}</Text>

                {!!item.caption && (
                  <Text style={styles.feedCaption}>{item.caption}</Text>
                )}

                {item.project.previewImages.length > 0 && (
                  <View style={styles.previewRow}>
                    {item.project.previewImages.map((uri, index) => (
                      <Image
                        key={`${item.id}-${index}`}
                        source={{ uri }}
                        style={styles.previewImage}
                      />
                    ))}
                  </View>
                )}

                <Text style={styles.feedMeta}>
                  {item.project.stampCount} stamp
                  {item.project.stampCount === 1 ? "" : "s"}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <BottomTabBar active="friends" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 128,
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    maxWidth: "100%",
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
  refreshPill: {
    flexShrink: 0,
    minWidth: 82,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  refreshPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSoft,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  emptySearchText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  resultList: {
    marginTop: 14,
    gap: 10,
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  personLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  personMeta: {
    flex: 1,
    minWidth: 0,
  },
  personName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  personHandle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flexShrink: 0,
    minWidth: 92,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonSmall: {
    flexShrink: 0,
    minWidth: 74,
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryText,
  },
  secondaryButtonSmall: {
    flexShrink: 0,
    minWidth: 74,
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  unfriendButtonSmall: {
    flexShrink: 0,
    minWidth: 84,
    minHeight: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  unfriendButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.danger,
  },
  statusPill: {
    flexShrink: 0,
    minHeight: 36,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSoft,
  },
  friendList: {
    gap: 12,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  friendBadge: {
    flexShrink: 0,
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  friendBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSoft,
  },
  feedCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: 14,
    marginBottom: 12,
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  feedHeaderMeta: {
    flex: 1,
    minWidth: 0,
  },
  feedOwner: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  feedHandle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  feedProjectName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  feedCaption: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
  previewRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  previewImage: {
    width: 84,
    height: 104,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundAlt,
  },
  feedMeta: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textMuted,
  },
});