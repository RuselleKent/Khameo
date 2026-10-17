import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  useFonts,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';

// Requires: react-native-svg, @expo-google-fonts/bricolage-grotesque, expo-font

const BRAND = { bg: '#079292', skin: '#ff6b3d' };

const SCENES = [
  { t: 'Heads down.', bg: '#4a4fc4', skin: '#6469d6' },
  { t: 'On the go.', bg: '#e4572e', skin: '#f27b57' },
  { t: 'Winding down.', bg: '#7a3e9d', skin: '#9658b8' },
];

// skin color keyframes: brand -> scene 1 -> scene 2 -> scene 3 -> brand
const SKIN_STOPS = [
  BRAND.skin,
  SCENES[0].skin,
  SCENES[1].skin,
  SCENES[2].skin,
  BRAND.skin,
];

const FONT_MEDIUM = 'BricolageGrotesque_500Medium';
const FONT_BOLD = 'BricolageGrotesque_700Bold';

// Mix between the skin colors. The chameleon colors are driven through
// state instead of animated SVG components, which avoids a web warning
// ("Received `false` for a non-boolean attribute").
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mixSkin(v) {
  const i = Math.min(Math.max(Math.floor(v), 0), SKIN_STOPS.length - 2);
  const t = Math.min(Math.max(v - i, 0), 1);
  const a = hexToRgb(SKIN_STOPS[i]);
  const b = hexToRgb(SKIN_STOPS[i + 1]);
  const c = a.map((x, k) => Math.round(x + (b[k] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const EASE_IN_OUT = Easing.bezier(0.42, 0, 0.58, 1);
const RIPPLE_EASE = Easing.bezier(0.5, 0, 0.3, 1);
const HERO_EASE = Easing.bezier(0.3, 0, 0.2, 1);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function SplashScreen() {
  const [fontsLoaded] = useFonts({
    [FONT_MEDIUM]: BricolageGrotesque_500Medium,
    [FONT_BOLD]: BricolageGrotesque_700Bold,
  });

  // the stage fills the whole screen; its size is measured on layout
  const [{ w: stageW, h: stageH }, setStageSize] = useState({ w: 390, h: 780 });

  const [bg, setBg] = useState(BRAND.bg);
  const [lineText, setLineText] = useState('');
  const [done, setDone] = useState(false);
  const [ctaText, setCtaText] = useState('Get started');
  const [ripples, setRipples] = useState([]);

  const run = useRef(0);
  const reduce = useRef(false);
  const rippleId = useRef(0);
  const sizeRef = useRef({ w: stageW, h: stageH });
  sizeRef.current = { w: stageW, h: stageH };

  const skinIdx = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(1)).current;
  const finalAnim = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(0)).current;
  const pupil = useRef(new Animated.Value(0)).current;

  const [skinColor, setSkinColor] = useState(BRAND.skin);
  const [pupilCx, setPupilCx] = useState(49);
  useEffect(() => {
    const a = skinIdx.addListener(({ value }) => setSkinColor(mixSkin(value)));
    const b = pupil.addListener(({ value }) => setPupilCx(49 + value));
    return () => {
      skinIdx.removeListener(a);
      pupil.removeListener(b);
    };
  }, [skinIdx, pupil]);

  // pupil "look" loop
  useEffect(() => {
    let loop;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      reduce.current = r;
      if (r) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pupil, { toValue: -3, duration: 1020, easing: EASE_IN_OUT, useNativeDriver: false }),
          Animated.timing(pupil, { toValue: 2, duration: 1020, easing: EASE_IN_OUT, useNativeDriver: false }),
          Animated.timing(pupil, { toValue: 0, duration: 1360, easing: EASE_IN_OUT, useNativeDriver: false }),
        ])
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [pupil]);

  // hero + final text transitions when "done" changes
  useEffect(() => {
    const d = reduce.current ? 0 : null;
    Animated.parallel([
      Animated.timing(finalAnim, {
        toValue: done ? 1 : 0,
        duration: d ?? 600,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(heroY, {
        toValue: done ? -70 : 0,
        duration: d ?? 800,
        easing: HERO_EASE,
        useNativeDriver: true,
      }),
      ...(done
        ? [
            Animated.timing(lineOpacity, {
              toValue: 0,
              duration: d ?? 260,
              easing: EASE,
              useNativeDriver: true,
            }),
          ]
        : []),
    ]).start();
  }, [done, finalAnim, heroY, lineOpacity]);

  // eye position inside the stage (used as the ripple origin)
  const eyeCenter = useCallback(() => {
    const { w, h } = sizeRef.current;
    const heroW = Math.min(w * 0.78, 300);
    const k = heroW / 240;
    const heroH = 180 * k;
    const contentH = heroH + 20 + 48;
    const heroTop = (h - contentH) / 2;
    return {
      x: (w - heroW) / 2 + 52 * k,
      y: heroTop + 82 * k,
    };
  }, []);

  const animateSkinTo = (index) =>
    new Promise((resolve) =>
      Animated.timing(skinIdx, {
        toValue: index,
        duration: reduce.current ? 0 : 1000,
        easing: EASE,
        useNativeDriver: false,
      }).start(() => resolve())
    );

  const shift = (c, skinStep) => {
    const { w, h } = sizeRef.current;
    const { x, y } = eyeCenter();
    const id = ++rippleId.current;
    const scale = new Animated.Value(0);
    setRipples((r) => [...r, { id, x, y, color: c.bg, scale }]);
    animateSkinTo(skinStep);
    Animated.timing(scale, {
      toValue: Math.hypot(w, h) / 10,
      duration: 1000,
      easing: RIPPLE_EASE,
      useNativeDriver: true,
    }).start();
    return sleep(1000).then(() => {
      setBg(c.bg);
      setRipples((r) => r.filter((n) => n.id !== id));
    });
  };

  const say = (t) => {
    Animated.timing(lineOpacity, {
      toValue: 0,
      duration: 260,
      easing: EASE,
      useNativeDriver: true,
    }).start();
    return sleep(260).then(() => {
      setLineText(t);
      Animated.timing(lineOpacity, {
        toValue: 1,
        duration: 260,
        easing: EASE,
        useNativeDriver: true,
      }).start();
    });
  };

  const resetVisuals = () => {
    setBg(BRAND.bg);
    skinIdx.setValue(0);
    setRipples([]);
    setLineText('');
  };

  const finish = () => {
    run.current++;
    resetVisuals();
    setDone(true);
  };

  const play = async () => {
    const id = ++run.current;
    reduce.current = await AccessibilityInfo.isReduceMotionEnabled();
    if (id !== run.current) return;
    setDone(false);
    lineOpacity.setValue(1);
    resetVisuals();
    if (reduce.current) {
      finish();
      return;
    }
    await sleep(700);
    for (let i = 0; i < SCENES.length; i++) {
      if (id !== run.current) return;
      say(SCENES[i].t);
      await shift(SCENES[i], i + 1);
      await sleep(550);
    }
    if (id !== run.current) return;
    Animated.timing(lineOpacity, {
      toValue: 0,
      duration: 260,
      easing: EASE,
      useNativeDriver: true,
    }).start();
    await shift({ bg: BRAND.bg, skin: BRAND.skin }, 4);
    if (id !== run.current) return;
    setDone(true);
  };

  useEffect(() => {
    if (!fontsLoaded) return;
    play();
    return () => {
      run.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const heroW = Math.min(stageW * 0.78, 300);

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setStageSize({ w: width, h: height });
        }}
        style={{
          flex: 1,
          backgroundColor: bg,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* ripples sit behind everything */}
        {ripples.map((r) => (
          <Animated.View
            key={r.id}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: r.x - 20,
              top: r.y - 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: r.color,
              transform: [{ scale: r.scale }],
            }}
          />
        ))}

        <Animated.View
          style={{
            width: heroW,
            aspectRatio: 240 / 180,
            transform: [{ translateY: heroY }],
          }}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 240 180"
            style={{ overflow: 'visible' }}
            accessibilityRole="image"
            accessibilityLabel="Khameo chameleon"
          >
            <Path
              d="M12 152H228"
              stroke="#fff"
              strokeOpacity={0.35}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <Path
              d="M150 112C192 120 207 90 189 77C174 67 157 82 170 93"
              fill="none"
              stroke={skinColor}
              strokeWidth={13}
              strokeLinecap="round"
            />
            <Path
              d="M62 100C70 64 132 62 158 92C171 109 150 134 112 137C84 139 60 125 62 100Z"
              fill={skinColor}
            />
            <Path d="M70 66L86 38L100 68Z" fill={skinColor} />
            <Circle cx={62} cy={86} r={26} fill={skinColor} />
            <Path
              d="M84 126Q80 142 88 149M132 128Q139 142 130 149"
              fill="none"
              stroke={skinColor}
              strokeWidth={9}
              strokeLinecap="round"
            />
            <Circle cx={110} cy={100} r={5} fill="#fff" opacity={0.22} />
            <Circle cx={130} cy={112} r={4} fill="#fff" opacity={0.22} />
            <Circle cx={94} cy={116} r={3.5} fill="#fff" opacity={0.22} />
            <Circle cx={52} cy={82} r={12} fill="#fff" />
            <Circle cx={pupilCx} cy={82} r={5} fill="#15302f" />
            <Path
              d="M36 95Q48 101 60 97"
              stroke="#000"
              strokeOpacity={0.28}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        <Animated.Text
          accessibilityLiveRegion="polite"
          style={{
            height: 48,
            marginTop: 20,
            fontSize: 34,
            lineHeight: 48,
            fontFamily: FONT_BOLD,
            letterSpacing: -0.68,
            color: '#fff',
            textAlign: 'center',
            opacity: lineOpacity,
          }}
        >
          {lineText}
        </Animated.Text>

        <Animated.View
          pointerEvents={done ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 28,
            paddingBottom: 36,
            alignItems: 'center',
            opacity: finalAnim,
            transform: [
              {
                translateY: finalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <Text
            style={{
              fontSize: 46,
              lineHeight: 46,
              fontFamily: FONT_BOLD,
              letterSpacing: -1.38,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            Khameo
          </Text>
          <Text
            style={{
              marginTop: 10,
              marginBottom: 26,
              maxWidth: 260,
              fontSize: 19,
              lineHeight: 25.65,
              fontFamily: FONT_MEDIUM,
              color: '#fff',
              opacity: 0.92,
              textAlign: 'center',
            }}
          >
            Adapts the moment you do.
          </Text>
          <Pressable
            onPress={() => setCtaText('Welcome, Khameleon')}
            accessibilityRole="button"
            style={{
              width: '100%',
              borderRadius: 16,
              padding: 17,
              backgroundColor: '#fff',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: FONT_BOLD,
                color: '#066c6c',
              }}
            >
              {ctaText}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Dev helper from the HTML prototype. Only shows in development. */}
      {__DEV__ && (
        <Pressable
          onPress={play}
          accessibilityRole="button"
          style={{ position: 'absolute', top: 12, left: 12, padding: 8 }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: FONT_MEDIUM,
              color: '#fff',
              opacity: 0.7,
            }}
          >
            Replay intro
          </Text>
        </Pressable>
      )}
    </View>
  );
}