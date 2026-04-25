import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Path,
  Rect,
} from "react-native-svg";
import {
  STAMP_OUTER_ASPECT,
  STAMP_OUTLINE_PATH,
  STAMP_PHOTO_RECT,
  STAMP_TEMPLATE,
} from "../../constants/stampTemplate";
import { COLORS } from "../../constants/theme";

type StampFrameProps = {
  uri: string;
  size?: number;
  shadow?: boolean;
};

export default function StampFrame({
  uri,
  size = 220,
  shadow = true,
}: StampFrameProps) {
  const ids = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2);
    return {
      photoClip: `stamp-photo-clip-${suffix}`,
    };
  }, []);

  const height = size * STAMP_OUTER_ASPECT;

  return (
    <View
      style={[
        styles.wrapper,
        shadow && styles.shadow,
        {
          width: size,
          height,
        },
      ]}
    >
      <Svg
        width={size}
        height={height}
        viewBox={`0 0 ${STAMP_TEMPLATE.outer.width} ${STAMP_TEMPLATE.outer.height}`}
      >
        <Defs>
          <ClipPath id={ids.photoClip}>
            <Rect
              x={STAMP_PHOTO_RECT.x}
              y={STAMP_PHOTO_RECT.y}
              width={STAMP_PHOTO_RECT.width}
              height={STAMP_PHOTO_RECT.height}
            />
          </ClipPath>
        </Defs>

        <G
          x={STAMP_TEMPLATE.svgGroupTranslate.x}
          y={STAMP_TEMPLATE.svgGroupTranslate.y}
        >
          <Path
            d={STAMP_OUTLINE_PATH}
            fill={COLORS.surface}
            stroke={COLORS.border}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </G>

        <G clipPath={`url(#${ids.photoClip})`}>
          <SvgImage
            href={{ uri }}
            x={STAMP_PHOTO_RECT.x}
            y={STAMP_PHOTO_RECT.y}
            width={STAMP_PHOTO_RECT.width}
            height={STAMP_PHOTO_RECT.height}
            preserveAspectRatio="xMidYMid slice"
          />
        </G>

        <Rect
          x={STAMP_PHOTO_RECT.x}
          y={STAMP_PHOTO_RECT.y}
          width={STAMP_PHOTO_RECT.width}
          height={STAMP_PHOTO_RECT.height}
          fill="none"
          stroke={COLORS.transparentWhite}
          strokeWidth={6}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
  },
  shadow: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
});