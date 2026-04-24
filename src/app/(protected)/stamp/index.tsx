import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import BottomTabBar from "../../../components/shared/BottomTabBar";
import { useAuth } from "../../../providers/AuthProvider";
import { getMyProfile, type MyProfile } from "../../../services/profiles";
import { getAcceptedFriends } from "../../../services/social";

const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 340;

const FLASH_ORDER = ["off", "auto", "on"] as const;
const ZOOM_STEPS = [
  { label: "1x", value: 0 },
  { label: "1.5x", value: 0.15 },
  { label: "2x", value: 0.35 },
] as const;

type FacingMode = "back" | "front";
type FlashMode = "off" | "auto" | "on";

function getFlashIcon(flash: FlashMode) {
  if (flash === "on") return "flash";
  if (flash === "auto") return "flash-outline";
  return "flash-off";
}

function getInitial(profile: MyProfile | null, email?: string | null) {
  const source =
    profile?.displayName ||
    profile?.username ||
    email?.split("@")[0] ||
    "U";

  return source.charAt(0).toUpperCase();
}

export default function StampCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<FacingMode>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [zoomIndex, setZoomIndex] = useState(0);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [friendCount, setFriendCount] = useState(0);

  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();

  const isShortScreen = height < 760;
  const cameraHorizontalMargin = width < 380 ? 22 : 28;
  const previewTop = isShortScreen ? 104 : 118;
  const previewBottom = isShortScreen ? 216 : 236;
  const captureBottom = isShortScreen ? 116 : 128;

  const frameWidth = Math.min(
    FRAME_WIDTH,
    Math.max(220, width - cameraHorizontalMargin * 2 - 74),
  );

  const frameHeight = Math.min(FRAME_HEIGHT, Math.max(260, height * 0.39));

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadMeta = async () => {
        if (!user) return;

        try {
          const [profileData, friends] = await Promise.all([
            getMyProfile(user.id),
            getAcceptedFriends(user.id),
          ]);

          if (!active) return;

          setProfile(profileData);
          setFriendCount(friends.length);
        } catch (error) {
          console.log("stamp meta load error:", error);
        }
      };

      loadMeta();

      return () => {
        active = false;
      };
    }, [user]),
  );

  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto || !cameraReady) return;

    try {
      setIsTakingPhoto(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo?.uri) return;

      router.push({
        pathname: "/stamp/review",
        params: { uri: photo.uri },
      });
    } catch (error) {
      console.log("takePicture error:", error);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const cycleFlash = () => {
    setFlash((current) => {
      const index = FLASH_ORDER.indexOf(current);
      return FLASH_ORDER[(index + 1) % FLASH_ORDER.length];
    });
  };

  const cycleZoom = () => {
    setZoomIndex((current) => (current + 1) % ZOOM_STEPS.length);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Allow camera access so you can capture stamps and save them to your
          scrapbook.
        </Text>

        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.avatarButton}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.avatarText}>
            {getInitial(profile, user?.email)}
          </Text>
        </Pressable>

        <Pressable
          style={styles.friendsPill}
          onPress={() => router.push("/friends")}
        >
          <Ionicons name="people" size={20} color="#5f5a56" />
          <Text style={styles.friendsPillText}>
            {friendCount > 0 ? `${friendCount} Friends` : "Friends"}
          </Text>
        </Pressable>

        <Pressable style={styles.iconCircle} onPress={cycleFlash}>
          <Ionicons name={getFlashIcon(flash)} size={22} color="#5f5a56" />
        </Pressable>
      </View>

      <View
        style={[
          styles.previewShell,
          {
            marginTop: previewTop,
            marginHorizontal: cameraHorizontalMargin,
            marginBottom: previewBottom,
          },
        ]}
      >
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
          zoom={ZOOM_STEPS[zoomIndex].value}
          mirror={facing === "front"}
          onCameraReady={() => setCameraReady(true)}
        />

        <View pointerEvents="none" style={styles.overlay}>
          <View
            style={[
              styles.frame,
              {
                width: frameWidth,
                height: frameHeight,
              },
            ]}
          />
        </View>
      </View>

      <View style={[styles.captureRow, { bottom: captureBottom }]}>
        <Pressable style={styles.controlButton} onPress={cycleZoom}>
          <Text style={styles.controlText}>{ZOOM_STEPS[zoomIndex].label}</Text>
        </Pressable>

        <Pressable
          style={[styles.shutterButton, isTakingPhoto && styles.shutterDisabled]}
          onPress={takePicture}
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <Pressable style={styles.controlButton} onPress={toggleFacing}>
          <Ionicons name="camera-reverse-outline" size={24} color="#5f5a56" />
        </Pressable>
      </View>

      <BottomTabBar active="stamp" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f1ed",
  },
  center: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: "#f5f1ed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2f2a27",
    marginBottom: 10,
  },
  permissionText: {
    color: "#6f6862",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#2f2a27",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: "#fffaf6",
    fontWeight: "700",
    fontSize: 15,
  },
  topBar: {
    position: "absolute",
    top: 48,
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fbf8f5",
    borderWidth: 2,
    borderColor: "#d7ad52",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarText: {
    color: "#2f2a27",
    fontSize: 22,
    fontWeight: "700",
  },
  friendsPill: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  friendsPillText: {
    color: "#3f3833",
    fontSize: 17,
    fontWeight: "700",
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  previewShell: {
    flex: 1,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.88)",
    borderRadius: 28,
    backgroundColor: "transparent",
  },
  captureRow: {
    position: "absolute",
    left: 26,
    right: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fbf8f5",
    borderWidth: 1,
    borderColor: "#e5ddd7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  controlText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#5f5a56",
  },
  shutterButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: "#6f6862",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  shutterDisabled: {
    opacity: 0.65,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fffdfb",
  },
});