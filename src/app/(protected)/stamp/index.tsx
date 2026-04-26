import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import BottomTabBar from "../../../components/shared/BottomTabBar";
import StampFrame from "../../../components/stamp/StampFrame";
import {
  STAMP_OUTER_ASPECT,
  STAMP_PHOTO_ASPECT,
  STAMP_PHOTO_RECT,
  STAMP_TEMPLATE,
} from "../../../constants/stampTemplate";
import { COLORS, SHADOWS } from "../../../constants/theme";
import { useAuth } from "../../../providers/AuthProvider";
import { getMyProfile, type MyProfile } from "../../../services/profiles";
import { getAcceptedFriends } from "../../../services/social";

const STAMP_CUTTER_SOURCE = require("../../../assets/stamp/stamp-cutter.png");

const CUTTER_ASSET_SIZE = Image.resolveAssetSource(STAMP_CUTTER_SOURCE);
const CUTTER_ASSET_WIDTH = CUTTER_ASSET_SIZE?.width || 1080;
const CUTTER_ASSET_HEIGHT = CUTTER_ASSET_SIZE?.height || 1920;
const CUTTER_ASPECT_RATIO = CUTTER_ASSET_HEIGHT / CUTTER_ASSET_WIDTH;

const CUTTER_RENDER_SCALE = 1.42;

/**
 * Turn this on only while debugging crop alignment.
 * Keep false for normal app usage.
 */
const DEBUG_SHOW_LIVE_CROP = false;

/**
 * Approximate transparent hole inside src/assets/stamp/stamp-cutter.png.
 * This is in the original PNG coordinate system.
 */
const STAMP_CUTTER_HOLE = {
  x: 359,
  y: 722,
  width: 365,
  height: 466,
} as const;

/**
 * Small tuning layer for the crop zone inside the cutter hole.
 * Do not use this for raw camera-photo offset correction.
 */
const CROP_ZONE_TUNING = {
  offsetX: 0,
  offsetY: 0,
  widthScale: 1,
} as const;

const FLASH_ORDER = ["off", "auto", "on"] as const;
const ZOOM_STEPS = [
  { label: "1x", value: 0 },
  { label: "1.5x", value: 0.15 },
  { label: "2x", value: 0.35 },
] as const;

type FacingMode = "back" | "front";
type FlashMode = "off" | "auto" | "on";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageSize = {
  width: number;
  height: number;
};

type ImageCrop = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

type StampFlightLayout = {
  left: number;
  top: number;
  size: number;
  height: number;
  targetTranslateX: number;
  targetTranslateY: number;
  targetScale: number;
};

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getImageSize(uri: string): Promise<ImageSize> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

function getStampCropZoneInCutterAsset(): Rect {
  const holeCenterX = STAMP_CUTTER_HOLE.x + STAMP_CUTTER_HOLE.width / 2;
  const holeCenterY = STAMP_CUTTER_HOLE.y + STAMP_CUTTER_HOLE.height / 2;

  const cropWidth = STAMP_CUTTER_HOLE.width * CROP_ZONE_TUNING.widthScale;
  const cropHeight = cropWidth / STAMP_PHOTO_ASPECT;

  return {
    x: holeCenterX - cropWidth / 2 + CROP_ZONE_TUNING.offsetX,
    y: holeCenterY - cropHeight / 2 + CROP_ZONE_TUNING.offsetY,
    width: cropWidth,
    height: cropHeight,
  };
}

function hasMeasuredSize(size: ImageSize) {
  return size.width > 0 && size.height > 0;
}

function getAspectRatio(size: ImageSize) {
  return size.width / size.height;
}

function mapPreviewCropDirectlyToPhotoCrop(params: {
  imageWidth: number;
  imageHeight: number;
  previewWidth: number;
  previewHeight: number;
  cropInPreview: Rect;
}): ImageCrop {
  const {
    imageWidth,
    imageHeight,
    previewWidth,
    previewHeight,
    cropInPreview,
  } = params;

  const scaleX = imageWidth / previewWidth;
  const scaleY = imageHeight / previewHeight;

  const cropWidth = cropInPreview.width * scaleX;
  const cropHeight = cropInPreview.height * scaleY;
  const originX = clamp(cropInPreview.x * scaleX, 0, imageWidth - cropWidth);
  const originY = clamp(cropInPreview.y * scaleY, 0, imageHeight - cropHeight);

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.max(1, Math.round(cropWidth)),
    height: Math.max(1, Math.round(cropHeight)),
  };
}

/**
 * Important:
 * Camera preview behaves like "cover".
 * Saved photo and preview are NOT the same aspect ratio on many Android devices.
 *
 * So we map the crop rectangle from preview coordinates into raw photo coordinates
 * using cover math:
 * - scale image up until it covers the preview
 * - center it
 * - account for cropped-off left/right or top/bottom areas
 */
function mapPreviewCropToPhotoCrop(params: {
  imageWidth: number;
  imageHeight: number;
  previewWidth: number;
  previewHeight: number;
  cropInPreview: Rect;
}): ImageCrop {
  const {
    imageWidth,
    imageHeight,
    previewWidth,
    previewHeight,
    cropInPreview,
  } = params;

  const coverScale = Math.max(
    previewWidth / imageWidth,
    previewHeight / imageHeight,
  );

  const displayedImageWidth = imageWidth * coverScale;
  const displayedImageHeight = imageHeight * coverScale;

  const imageLeftInPreview = (previewWidth - displayedImageWidth) / 2;
  const imageTopInPreview = (previewHeight - displayedImageHeight) / 2;

  const rawOriginX = (cropInPreview.x - imageLeftInPreview) / coverScale;
  const rawOriginY = (cropInPreview.y - imageTopInPreview) / coverScale;
  const rawWidth = cropInPreview.width / coverScale;
  const rawHeight = cropInPreview.height / coverScale;

  let cropWidth = rawWidth;
  let cropHeight = rawHeight;

  if (cropWidth > imageWidth) {
    cropWidth = imageWidth;
    cropHeight = cropWidth / STAMP_PHOTO_ASPECT;
  }

  if (cropHeight > imageHeight) {
    cropHeight = imageHeight;
    cropWidth = cropHeight * STAMP_PHOTO_ASPECT;
  }

  const originX = clamp(rawOriginX, 0, imageWidth - cropWidth);
  const originY = clamp(rawOriginY, 0, imageHeight - cropHeight);

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.max(1, Math.round(cropWidth)),
    height: Math.max(1, Math.round(cropHeight)),
  };
}

async function cropPhotoToStamp(params: {
  photoUri: string;
  capturedSize?: ImageSize;
  previewWidth: number;
  previewHeight: number;
  cropInPreview: Rect;
}) {
  const fallbackSize = await getImageSize(params.photoUri);
  const imageSize =
    params.capturedSize && hasMeasuredSize(params.capturedSize)
      ? params.capturedSize
      : fallbackSize;
  const previewSize = {
    width: params.previewWidth,
    height: params.previewHeight,
  };
  const previewAspect = getAspectRatio(previewSize);
  const imageAspect = getAspectRatio(imageSize);
  const aspectDelta = Math.abs(previewAspect - imageAspect);
  const shouldUseDirectCrop = aspectDelta < 0.04;

  const cropParams = {
    imageWidth: imageSize.width,
    imageHeight: imageSize.height,
    previewWidth: params.previewWidth,
    previewHeight: params.previewHeight,
    cropInPreview: params.cropInPreview,
  };
  const crop = shouldUseDirectCrop
    ? mapPreviewCropDirectlyToPhotoCrop(cropParams)
    : mapPreviewCropToPhotoCrop(cropParams);

  if (DEBUG_SHOW_LIVE_CROP) {
    console.log("automatic stamp crop:", {
      strategy: shouldUseDirectCrop ? "direct" : "cover",
      imageSize,
      fallbackSize,
      aspectDelta,
      preview: {
        width: params.previewWidth,
        height: params.previewHeight,
      },
      cropInPreview: params.cropInPreview,
      crop,
    });
  }

  const result = await ImageManipulator.manipulateAsync(
    params.photoUri,
    [
      { crop },
      {
        resize: {
          width: STAMP_TEMPLATE.photo.width,
          height: STAMP_TEMPLATE.photo.height,
        },
      },
    ],
    {
      compress: 0.94,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
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
  const [previewLayout, setPreviewLayout] = useState<ImageSize>({
    width: 0,
    height: 0,
  });
  const [flightUri, setFlightUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const shutterFlashProgress = useRef(new Animated.Value(0)).current;
  const stampFlightProgress = useRef(new Animated.Value(0)).current;
  const cutterPressProgress = useRef(new Animated.Value(0)).current;
  const uiCaptureProgress = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();

  const isCompactWidth = width < 380;
  const isShortScreen = height < 760;

  const topControlSize = isCompactWidth ? 46 : 50;
  const topBarTop = isShortScreen ? 36 : 42;

  const cameraHorizontalMargin = isCompactWidth ? 16 : 20;
  const previewTop = isShortScreen ? 90 : 98;
  const previewBottom = isShortScreen ? 106 : 114;

  const targetPreviewWidth = width - cameraHorizontalMargin * 2;
  const targetPreviewHeight = Math.max(430, height - previewTop - previewBottom);
  const previewWidth = hasMeasuredSize(previewLayout)
    ? previewLayout.width
    : targetPreviewWidth;
  const previewHeight = hasMeasuredSize(previewLayout)
    ? previewLayout.height
    : targetPreviewHeight;

  const cutterWidth = Math.min(
    previewWidth * CUTTER_RENDER_SCALE,
    isCompactWidth ? 500 : 540,
  );
  const cutterHeight = cutterWidth * CUTTER_ASPECT_RATIO;
  const cutterTranslateY = -previewHeight * 0.045;

  const cutterLayout = useMemo(() => {
    const cutterLeft = (previewWidth - cutterWidth) / 2;
    const cutterTop = (previewHeight - cutterHeight) / 2 + cutterTranslateY;

    const cropZone = getStampCropZoneInCutterAsset();

    return {
      cropInPreview: {
        x: cutterLeft + (cropZone.x / CUTTER_ASSET_WIDTH) * cutterWidth,
        y: cutterTop + (cropZone.y / CUTTER_ASSET_HEIGHT) * cutterHeight,
        width: (cropZone.width / CUTTER_ASSET_WIDTH) * cutterWidth,
        height: (cropZone.height / CUTTER_ASSET_HEIGHT) * cutterHeight,
      },
    };
  }, [cutterHeight, cutterTranslateY, cutterWidth, previewHeight, previewWidth]);

  const reviewPreviewSize = useMemo(() => {
    const maxByWidth = width - 80;
    const maxPreview = height < 760 ? 235 : 285;

    return Math.min(maxByWidth, maxPreview);
  }, [height, width]);

  const stampFlightLayout = useMemo<StampFlightLayout | null>(() => {
    if (!hasMeasuredSize(previewLayout)) return null;

    const photoScale =
      cutterLayout.cropInPreview.width / STAMP_PHOTO_RECT.width;
    const startSize = STAMP_TEMPLATE.outer.width * photoScale;
    const startLeft =
      cameraHorizontalMargin +
      cutterLayout.cropInPreview.x -
      STAMP_PHOTO_RECT.x * photoScale;
    const startTop =
      previewTop +
      cutterLayout.cropInPreview.y -
      STAMP_PHOTO_RECT.y * photoScale;
    const targetLeft = (width - reviewPreviewSize) / 2;
    const targetTop = 42;
    const targetScale = reviewPreviewSize / startSize;

    return {
      left: startLeft,
      top: startTop,
      size: startSize,
      height: startSize * STAMP_OUTER_ASPECT,
      targetTranslateX: targetLeft - startLeft,
      targetTranslateY: targetTop - startTop,
      targetScale,
    };
  }, [
    cameraHorizontalMargin,
    cutterLayout.cropInPreview,
    height,
    previewLayout,
    previewTop,
    reviewPreviewSize,
    width,
  ]);

  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    const nextHeight = Math.round(event.nativeEvent.layout.height);

    setPreviewLayout((current) => {
      if (current.width === nextWidth && current.height === nextHeight) {
        return current;
      }

      return {
        width: nextWidth,
        height: nextHeight,
      };
    });
  }, []);

  const playShutterFlash = useCallback(() => {
    shutterFlashProgress.setValue(0);

    Animated.sequence([
      Animated.timing(shutterFlashProgress, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shutterFlashProgress, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [shutterFlashProgress]);

  const playUiFadeOut = useCallback(() => {
    Animated.timing(uiCaptureProgress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [uiCaptureProgress]);

  const playCutterPress = useCallback(() => {
    cutterPressProgress.setValue(0);

    Animated.sequence([
      Animated.timing(cutterPressProgress, {
        toValue: 1,
        duration: 95,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cutterPressProgress, {
        toValue: 2,
        duration: 135,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cutterPressProgress, {
        toValue: 3,
        duration: 130,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cutterPressProgress]);

  const playStampFlight = useCallback(() => {
    stampFlightProgress.setValue(0);

    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        Animated.timing(stampFlightProgress, {
          toValue: 1,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => resolve());
      });
    });
  }, [stampFlightProgress]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setIsTakingPhoto(false);
      setFlightUri(null);
      shutterFlashProgress.setValue(0);
      stampFlightProgress.setValue(0);
      cutterPressProgress.setValue(0);
      uiCaptureProgress.setValue(0);

      cameraRef.current?.resumePreview().catch((error) => {
        console.log("resumePreview(focus) error:", error);
      });

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
    }, [
      cutterPressProgress,
      shutterFlashProgress,
      stampFlightProgress,
      uiCaptureProgress,
      user,
    ]),
  );

  const takePicture = async () => {
    if (
      !cameraRef.current ||
      isTakingPhoto ||
      !cameraReady ||
      !hasMeasuredSize(previewLayout)
    ) {
      return;
    }

    try {
      setIsTakingPhoto(true);
      setFlightUri(null);
      stampFlightProgress.setValue(0);
      uiCaptureProgress.setValue(0);
      playShutterFlash();
      playUiFadeOut();
      playCutterPress();

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.95,
      });

      if (!photo?.uri) return;

      try {
        await cameraRef.current.pausePreview();
      } catch (pauseError) {
        console.log("pausePreview error:", pauseError);
      }

      const stampPhotoUri = await cropPhotoToStamp({
        photoUri: photo.uri,
        capturedSize: {
          width: photo.width,
          height: photo.height,
        },
        previewWidth: previewLayout.width,
        previewHeight: previewLayout.height,
        cropInPreview: cutterLayout.cropInPreview,
      });

      setFlightUri(stampPhotoUri);
      await playStampFlight();

      router.push({
        pathname: "/stamp/review",
        params: { uri: stampPhotoUri },
      });
    } catch (error) {
      console.log("takePicture error:", error);
      uiCaptureProgress.setValue(0);
      cutterPressProgress.setValue(0);
      try {
        await cameraRef.current?.resumePreview();
      } catch (resumeError) {
        console.log("resumePreview error:", resumeError);
      }
      Alert.alert("Error", "Failed to prepare stamp photo.");
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const stampFlightStyle = stampFlightLayout
    ? {
        left: stampFlightLayout.left,
        top: stampFlightLayout.top,
        width: stampFlightLayout.size,
        height: stampFlightLayout.height,
        opacity: stampFlightProgress.interpolate({
          inputRange: [0, 0.08, 0.86, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          {
            translateX: stampFlightProgress.interpolate({
              inputRange: [0, 0.22, 1],
              outputRange: [0, 0, stampFlightLayout.targetTranslateX],
            }),
          },
          {
            translateY: stampFlightProgress.interpolate({
              inputRange: [0, 0.16, 1],
              outputRange: [12, -14, stampFlightLayout.targetTranslateY],
            }),
          },
          {
            scale: stampFlightProgress.interpolate({
              inputRange: [0, 0.16, 0.28, 1],
              outputRange: [0.78, 1.08, 1, stampFlightLayout.targetScale],
            }),
          },
          {
            rotate: stampFlightProgress.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: ["-2deg", "-1deg", "0deg"],
            }),
          },
        ],
      }
    : null;

  const uiCaptureStyle = {
    opacity: uiCaptureProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.24],
    }),
    transform: [
      {
        scale: uiCaptureProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.98],
        }),
      },
    ],
  };

  const cutterPressScale = cutterPressProgress.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [1, 0.972, 1.018, 1],
  });

  const transitionReviewStyle = {
    opacity: stampFlightProgress.interpolate({
      inputRange: [0, 0.28, 0.72, 1],
      outputRange: [0, 0, 0.96, 1],
    }),
    transform: [
      {
        translateY: stampFlightProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const toggleFacing = () => {
    if (isTakingPhoto) return;

    setCameraReady(false);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const cycleFlash = () => {
    if (isTakingPhoto) return;

    setFlash((current) => {
      const index = FLASH_ORDER.indexOf(current);
      return FLASH_ORDER[(index + 1) % FLASH_ORDER.length];
    });
  };

  const cycleZoom = () => {
    if (isTakingPhoto) return;

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
      <Animated.View
        pointerEvents={isTakingPhoto ? "none" : "auto"}
        style={[
          styles.topBar,
          uiCaptureStyle,
          {
            top: topBarTop,
            left: cameraHorizontalMargin,
            right: cameraHorizontalMargin,
          },
        ]}
      >
        <Pressable
          style={[
            styles.avatarButton,
            {
              width: topControlSize,
              height: topControlSize,
              borderRadius: topControlSize / 2,
            },
          ]}
          onPress={() => router.push("/profile")}
          disabled={isTakingPhoto}
        >
          {profile?.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={{
                width: topControlSize,
                height: topControlSize,
                borderRadius: topControlSize / 2,
              }}
            />
          ) : (
            <Text style={styles.avatarText}>
              {getInitial(profile, user?.email)}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.friendsPill,
            {
              minHeight: topControlSize,
              borderRadius: topControlSize / 2,
            },
          ]}
          onPress={() => router.push("/friends")}
          disabled={isTakingPhoto}
        >
          <Ionicons name="people" size={19} color={COLORS.textSoft} />
          <Text style={styles.friendsPillText}>
            {friendCount > 0 ? `${friendCount} Friends` : "Friends"}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.iconCircle,
            {
              width: topControlSize,
              height: topControlSize,
              borderRadius: topControlSize / 2,
            },
          ]}
          onPress={cycleFlash}
          disabled={isTakingPhoto}
        >
          <Ionicons name={getFlashIcon(flash)} size={21} color={COLORS.textSoft} />
        </Pressable>
      </Animated.View>

      <View
        onLayout={handlePreviewLayout}
        style={[
          styles.previewShell,
          {
            height: targetPreviewHeight,
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

        <Animated.View
          pointerEvents="none"
          style={[
            styles.shutterFlash,
            {
              opacity: shutterFlashProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.68],
              }),
            },
          ]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.cutterLayer,
            {
              transform: [
                { translateY: cutterTranslateY },
                { scale: cutterPressScale },
              ],
            },
          ]}
        >
          <Image
            source={STAMP_CUTTER_SOURCE}
            style={{
              width: cutterWidth,
              height: cutterHeight,
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {DEBUG_SHOW_LIVE_CROP && (
          <View
            pointerEvents="none"
            style={[
              styles.debugCropRect,
              {
                left: cutterLayout.cropInPreview.x,
                top: cutterLayout.cropInPreview.y,
                width: cutterLayout.cropInPreview.width,
                height: cutterLayout.cropInPreview.height,
              },
            ]}
          >
            <Text style={styles.debugCropLabel}>crop</Text>
          </View>
        )}

        {isTakingPhoto && (
          <View pointerEvents="none" style={styles.capturingPill}>
            <ActivityIndicator color={COLORS.textSoft} size="small" />
            <Text style={styles.capturingText}>Making stamp...</Text>
          </View>
        )}

        <Animated.View
          pointerEvents={isTakingPhoto ? "none" : "auto"}
          style={[styles.previewCaptureRow, uiCaptureStyle]}
        >
          <Pressable
            style={styles.controlButton}
            onPress={cycleZoom}
            disabled={isTakingPhoto}
          >
            <Text style={styles.controlText}>{ZOOM_STEPS[zoomIndex].label}</Text>
          </Pressable>

          <Pressable
            style={[
              styles.shutterButton,
              isTakingPhoto && styles.shutterDisabled,
            ]}
            onPress={takePicture}
            disabled={isTakingPhoto}
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable
            style={styles.controlButton}
            onPress={toggleFacing}
            disabled={isTakingPhoto}
          >
            <Ionicons name="camera-reverse-outline" size={24} color={COLORS.textSoft} />
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.bottomBarLayer, uiCaptureStyle]}
      >
        <BottomTabBar active="stamp" />
      </Animated.View>

      {flightUri && (
        <Animated.View
          pointerEvents="none"
          style={[styles.transitionReviewLayer, transitionReviewStyle]}
        >
          <View style={styles.transitionReviewContent}>
            <View
              style={[
                styles.transitionPreviewSpace,
                {
                  width: reviewPreviewSize,
                  height: reviewPreviewSize * STAMP_OUTER_ASPECT,
                },
              ]}
            />

            <View style={styles.transitionFormArea}>
              <Text style={styles.transitionFieldLabel}>Title</Text>
              <View style={styles.transitionTitleInput}>
                <Text style={styles.transitionPlaceholder}>Give it a title</Text>
              </View>

              <View style={styles.transitionCaptionRow}>
                <Text style={styles.transitionFieldLabel}>Note</Text>
                <Text style={styles.transitionOptionalText}>Optional</Text>
              </View>

              <View style={styles.transitionNoteInput}>
                <Text style={styles.transitionPlaceholder}>Add a note...</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {flightUri && stampFlightStyle && (
        <Animated.View
          pointerEvents="none"
          style={[styles.stampFlightLayer, stampFlightStyle]}
        >
          <StampFrame uri={flightUri} size={stampFlightLayout?.size} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  permissionText: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: COLORS.primaryText,
    fontWeight: "700",
    fontSize: 15,
  },
  topBar: {
    position: "absolute",
    zIndex: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...SHADOWS.soft,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  friendsPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    ...SHADOWS.soft,
  },
  friendsPillText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  iconCircle: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },
  previewShell: {
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: COLORS.cameraBlack,
  },
  camera: {
    flex: 1,
  },
  shutterFlash: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
    backgroundColor: COLORS.surface,
  },
  cutterLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  debugCropRect: {
    position: "absolute",
    zIndex: 15,
    borderWidth: 3,
    borderColor: COLORS.debug,
    borderRadius: 6,
    backgroundColor: COLORS.debugSoft,
  },
  debugCropLabel: {
    position: "absolute",
    left: 6,
    top: 5,
    borderRadius: 999,
    backgroundColor: COLORS.overlayLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: COLORS.debug,
    fontSize: 12,
    fontWeight: "800",
  },
  capturingPill: {
    position: "absolute",
    left: "50%",
    bottom: 112,
    width: 156,
    zIndex: 18,
    backgroundColor: COLORS.overlayLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transform: [{ translateX: -78 }],
  },
  capturingText: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  previewCaptureRow: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 18,
    zIndex: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.soft,
  },
  controlText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textSoft,
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.translucentSurface,
  },
  shutterDisabled: {
    opacity: 0.65,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
  },
  bottomBarLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  transitionReviewLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 32,
    backgroundColor: COLORS.background,
  },
  transitionReviewContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 32,
  },
  transitionPreviewSpace: {
    alignSelf: "center",
    marginBottom: 26,
  },
  transitionFormArea: {
    flex: 1,
  },
  transitionFieldLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textSoft,
    marginBottom: 8,
  },
  transitionTitleInput: {
    height: 58,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    justifyContent: "center",
    marginBottom: 18,
  },
  transitionCaptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transitionOptionalText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  transitionNoteInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  transitionPlaceholder: {
    color: COLORS.placeholder,
    fontSize: 18,
  },
  stampFlightLayer: {
    position: "absolute",
    zIndex: 40,
  },
});