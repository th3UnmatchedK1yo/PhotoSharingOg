import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export default function StampCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto) return;

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

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission is required.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.frame} />
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.secondaryButton} onPress={() => router.push("/book")}>
          <Text style={styles.secondaryButtonText}>Book</Text>
        </Pressable>

        <Pressable
          style={[styles.shutterButton, isTakingPhoto && { opacity: 0.6 }]}
          onPress={takePicture}
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <View style={styles.placeholder}>
          <Text style={styles.secondaryButtonText}>Stamp</Text>
        </View>
      </View>
    </View>
  );
}

const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 340;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#111",
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 28,
    backgroundColor: "transparent",
  },
  bottomBar: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secondaryButton: {
    minWidth: 70,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  placeholder: {
    minWidth: 70,
    alignItems: "center",
  },
  shutterButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },
});