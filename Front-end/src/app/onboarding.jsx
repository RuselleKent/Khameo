import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  BackHandler,
  Easing,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useFonts, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';

// Khameo onboarding: five pages on a 390 x 844 canvas.
// Requires: react-native-svg, expo-font, expo-router, @expo-google-fonts/figtree
// Needs the image at src/assets/khameleon.png

// ---------------------------------------------------------------- design ---

const DESIGN = { width: 390, height: 844 };

const COLORS = {
  bg: '#16a39a',
  circleLight: '#39b9b1',
  circleDark: '#1d857e',
  white: '#ffffff',
  dotIdle: '#d9d9d9',
  tileShadow: '#077074',
  glyph: '#ff7048',
  buttonText: '#16a39a',
};

// Figtree is the closest free match to the original typeface.
// To change the font, edit these names and the imports above.
const FONTS = {
  title: 'Figtree_700Bold',
  body: 'Figtree_600SemiBold',
  button: 'Figtree_700Bold',
  secondary: 'Figtree_600SemiBold',
};

const KHAMELEON = require('../assets/khameleon.png');
// Where the chameleon sits on the canvas (design px)
const KHAMELEON_BOX = { left: 60, top: 162, width: 285, height: 258 };

// The two flat circles behind the artwork
const LIGHT_CIRCLE = { cx: 322.8, cy: 323.4, r: 203.4 };
const DARK_CIRCLE = { cx: 0.9, cy: 647.9, r: 151.7 };

const TILE = { left: 33.5, top: 78, size: 76, radius: 22, shadow: 6 };
const TITLE_TOP = 457;
const TITLE_TOP_FINAL = 526;
const BODY_TOP = 584;
const DOTS_TOP = 667;
const BUTTON = { left: 25, top: 709, width: 340, height: 52 };
const SECONDARY_TOP = 777;
const DOT_COUNT = 4;

// Line breaks are written out so every page wraps exactly like the design.
const STEPS = [
  {
    id: 'why',
    icon: 'shield',
    title: ['Why i ask for a few', 'things'],
    body: [
      'A little access helps me match your mood',
      'and your day. You stay in control of every',
      'one.',
    ],
    dot: 0,
    primary: 'Next',
    secondary: null,
  },
  {
    id: 'mic',
    icon: 'mic',
    title: ['Let me hear you'],
    body: ['Your voice tells me how you feel. I only', 'listen while khameo is open'],
    dot: 1,
    primary: 'Next',
    secondary: 'Not now',
  },
  {
    id: 'files',
    icon: 'folder',
    title: ['Let me keep your', 'voice'],
    body: ['Enabling file access allows us to save this audio', 'for your upcoming milestone.'],
    dot: 2,
    primary: 'Allow files',
    secondary: 'Not now',
  },
  {
    id: 'notifications',
    icon: 'bell',
    title: ['A nudge, not a nag'],
    body: ['I check in when it helps and stays quiet', "when it doesn't. Change this anytime"],
    dot: 3,
    primary: 'Allow notifications',
    secondary: 'Not now',
  },
  {
    id: 'done',
    icon: null,
    title: ['You’re all set!'],
    body: ['Everything is ready. Your day starts with', 'Khameo now.'],
    dot: null,
    primary: 'Join Khameo',
    secondary: null,
    final: true,
  },
];

// ----------------------------------------------------------------- icons ---
// Drawn in tile coordinates (76 x 76).

const GLYPHS = {
  shield: (
    <>
      <Path
        d="M26.5 31.5C26.5 29.3 27.4 28.2 29.4 28C33 27.6 35.3 26.6 36.7 25.3C37.4 24.8 38.6 24.8 39.3 25.3C40.7 26.6 43 27.6 46.6 28C48.6 28.2 49.5 29.3 49.5 31.5V43C49.5 47 45.5 49.8 38 52C30.5 49.8 26.5 47 26.5 43Z"
        fill={COLORS.glyph}
      />
      <Path
        d="M33.2 38.3L36.5 41.6L43.8 34.4"
        stroke={COLORS.white}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  mic: (
    <>
      <Path
        d="M38.5 26C41.3 26 43.5 28.2 43.5 31V39C43.5 41.8 41.3 44 38.5 44C35.7 44 33.5 41.8 33.5 39V31C33.5 28.2 35.7 26 38.5 26Z"
        fill={COLORS.glyph}
      />
      <Path
        d="M29.5 36.5V38.5A9 9 0 0 0 47.5 38.5V36.5"
        stroke={COLORS.glyph}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M38.5 47.5V52" stroke={COLORS.glyph} strokeWidth={2} fill="none" />
    </>
  ),
  folder: (
    <Path
      d="M24.5 27H33.5Q34.5 27 34.5 28V30H47.5Q50.5 30 50.5 33V47.5Q50.5 50 48 50H25Q22.5 50 22.5 47.5V29Q22.5 27 24.5 27Z"
      fill={COLORS.glyph}
    />
  ),
  bell: (
    <>
      <Path
        d="M37.5 26C41.4 26 44.5 29.1 44.5 33V36.2C44.5 37.8 45.1 38.9 46.3 40L47 40.7C47.8 41.4 47.9 42.9 46.2 43H28.8C27.1 42.9 27.2 41.4 28 40.7L28.7 40C29.9 38.9 30.5 37.8 30.5 36.2V33C30.5 29.1 33.6 26 37.5 26Z"
        fill={COLORS.glyph}
      />
      <Path
        d="M34.6 45.1C35 46.8 36.1 47.8 37.5 47.8C38.9 47.8 40 46.8 40.4 45.1L38.9 45.1C38.7 46 38.2 46.4 37.5 46.4C36.8 46.4 36.3 46 36.1 45.1Z"
        fill={COLORS.glyph}
      />
    </>
  ),
};

function IconTile({ icon }) {
  if (!GLYPHS[icon]) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: TILE.left,
        top: TILE.top,
        width: TILE.size,
        height: TILE.size + TILE.shadow,
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: TILE.shadow,
          width: TILE.size,
          height: TILE.size,
          borderRadius: TILE.radius,
          backgroundColor: COLORS.tileShadow,
        }}
      />
      <View
        style={{
          width: TILE.size,
          height: TILE.size,
          borderRadius: TILE.radius,
          backgroundColor: COLORS.white,
          overflow: 'hidden',
        }}
      >
        <Svg width={TILE.size} height={TILE.size} viewBox={`0 0 ${TILE.size} ${TILE.size}`}>
          {GLYPHS[icon]}
        </Svg>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ dots ---

function Dots({ active }) {
  if (active === null) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${active + 1} of ${DOT_COUNT}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: DOTS_TOP,
        height: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 41 : 16,
            height: 16,
            borderRadius: 8,
            marginLeft: i === 0 ? 0 : 14,
            backgroundColor: i === active ? COLORS.white : COLORS.dotIdle,
          }}
        />
      ))}
    </View>
  );
}

// ------------------------------------------------------- one page's content ---

function StepContent({ step, onPrimary, onSecondary }) {
  return (
    <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <IconTile icon={step.icon} />

      <Text
        accessibilityRole="header"
        numberOfLines={step.title.length}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: step.final ? TITLE_TOP_FINAL : TITLE_TOP,
          fontFamily: FONTS.title,
          fontSize: 40,
          lineHeight: 52,
          color: COLORS.white,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {step.title.join('\n')}
      </Text>

      <Text
        numberOfLines={step.body.length}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          top: BODY_TOP,
          fontFamily: FONTS.body,
          fontSize: 15,
          lineHeight: 21,
          color: COLORS.white,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {step.body.join('\n')}
      </Text>

      <Dots active={step.dot} />

      <Pressable
        onPress={onPrimary}
        accessibilityRole="button"
        accessibilityLabel={step.primary}
        style={({ pressed }) => ({
          position: 'absolute',
          left: BUTTON.left,
          top: BUTTON.top,
          width: BUTTON.width,
          height: BUTTON.height,
          borderRadius: BUTTON.height / 2,
          backgroundColor: COLORS.white,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: FONTS.button,
            fontSize: 24,
            color: COLORS.buttonText,
            includeFontPadding: false,
          }}
        >
          {step.primary}
        </Text>
      </Pressable>

      {step.secondary ? (
        <Pressable
          onPress={onSecondary}
          accessibilityRole="button"
          accessibilityLabel={step.secondary}
          hitSlop={12}
          style={({ pressed }) => ({
            position: 'absolute',
            left: 0,
            right: 0,
            top: SECONDARY_TOP,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: FONTS.secondary,
              fontSize: 22,
              color: COLORS.white,
              includeFontPadding: false,
            }}
          >
            {step.secondary}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ page ---

const circle = ({ cx, cy, r }, color) => ({
  position: 'absolute',
  left: cx - r,
  top: cy - r,
  width: r * 2,
  height: r * 2,
  borderRadius: r,
  backgroundColor: color,
});

const OUT_MS = 160;
const IN_MS = 380;
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.4, 0, 1, 1);

export default function Onboarding({ initialIndex = 0 }) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    [FONTS.title]: Figtree_700Bold,
    [FONTS.body]: Figtree_600SemiBold,
  });

  const [index, setIndex] = useState(initialIndex);
  const fade = useRef(new Animated.Value(1)).current;
  const shift = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);
  const reduceMotion = useRef(false);
  const step = STEPS[index];

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
  }, []);

  // Smooth page change: the current page fades out and slides a little,
  // then the next one slides in from the side. The chameleon stays put.
  const goTo = useCallback(
    (next) => {
      if (busy.current || next < 0 || next >= STEPS.length) return;
      busy.current = true;
      const dir = next > index ? 1 : -1;
      const out = reduceMotion.current ? 0 : OUT_MS;
      const into = reduceMotion.current ? 0 : IN_MS;

      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: out, easing: EASE_IN, useNativeDriver: true }),
        Animated.timing(shift, { toValue: -14 * dir, duration: out, easing: EASE_IN, useNativeDriver: true }),
      ]).start(() => {
        shift.setValue(18 * dir);
        setIndex(next);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: into, easing: EASE_OUT, useNativeDriver: true }),
          Animated.timing(shift, { toValue: 0, duration: into, easing: EASE_OUT, useNativeDriver: true }),
        ]).start(() => {
          busy.current = false;
        });
      });
    },
    [index, fade, shift]
  );

  const handleNext = useCallback(() => goTo(index + 1), [goTo, index]);

  const handleJoin = useCallback(() => {
    // TODO: hand over to sign-up / login (Laravel API) once the backend is ready.
    // eslint-disable-next-line no-console
    console.log('Join Khameo');
  }, []);

  // Android back button steps back through the pages, then leaves the flow
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (index > 0) {
        goTo(index - 1);
        return true;
      }
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [index, goTo, router]);

  // the 390 x 844 design is scaled to fit whatever device this runs on
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / DESIGN.width, height / DESIGN.height);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: DESIGN.width, height: DESIGN.height, transform: [{ scale }] }}>
        <View pointerEvents="none" style={circle(LIGHT_CIRCLE, COLORS.circleLight)} />
        <View pointerEvents="none" style={circle(DARK_CIRCLE, COLORS.circleDark)} />

        <Image
          source={KHAMELEON}
          resizeMode="contain"
          accessibilityLabel="Khameo the chameleon"
          style={{ position: 'absolute', ...KHAMELEON_BOX }}
        />

        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            opacity: fade,
            transform: [{ translateX: shift }],
          }}
        >
          <StepContent
            step={step}
            onPrimary={step.final ? handleJoin : handleNext}
            onSecondary={handleNext}
          />
        </Animated.View>
      </View>
    </View>
  );
}
