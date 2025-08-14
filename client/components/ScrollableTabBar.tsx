import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { ViewStyle, TextStyle } from "react-native";
import { Tabs } from "expo-router";
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import {
  Home,
  History,
  Camera,
  TrendingUp,
  User,
  Calendar,
  Watch,
  UtensilsCrossed,
  Bot,
  Scan,
  ClipboardList,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const TAB_HEIGHT = 70;
const TAB_ICON_SIZE = 24;
const CAMERA_BUTTON_SIZE = 60;
const INDICATOR_HEIGHT = 4;

// Enhanced icon mapping with better visual hierarchy
const iconMap = {
  index: Home,
  history: History,
  camera: Camera,
  statistics: TrendingUp,
  calendar: Calendar,
  devices: Watch,
  "recommended-menus": UtensilsCrossed,
  "ai-chat": Bot,
  "food-scanner": Scan,
  questionnaire: ClipboardList,
  profile: User,
};

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function ScrollableTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const iconAnimations = useRef(
    state.routes.map(() => ({
      scale: new Animated.Value(1),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0.7),
    }))
  ).current;

  // Calculate tab dimensions
  const tabCalculations = useMemo(() => {
    const routesCount = state.routes.length;
    const visibleTabs = Math.min(routesCount, 5);
    const tabWidth = SCREEN_WIDTH / visibleTabs;
    const totalWidth = routesCount * tabWidth;
    const needsScroll = totalWidth > SCREEN_WIDTH;
    
    const activeIndex = state.index;
    const cameraIndex = state.routes.findIndex(
      (route: any) => route.name === "camera"
    );

    return {
      tabWidth,
      totalWidth,
      needsScroll,
      activeIndex,
      cameraIndex,
      routesCount,
    };
  }, [state.routes.length, state.index]);

  // Enhanced animation system
  const animateToActiveTab = useCallback(() => {
    const { activeIndex, tabWidth, cameraIndex } = tabCalculations;

    // Animate indicator
    Animated.spring(indicatorAnim, {
      toValue: activeIndex * tabWidth + tabWidth / 2 - 20,
      useNativeDriver: true,
      tension: 300,
      friction: 25,
    }).start();

    // Animate icons
    iconAnimations.forEach((anim, index) => {
      const isActive = index === activeIndex;
      const isCamera = index === cameraIndex;

      if (!isCamera) {
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: isActive ? 1.1 : 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
          Animated.spring(anim.translateY, {
            toValue: isActive ? -2 : 0,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
          Animated.timing(anim.opacity, {
            toValue: isActive ? 1 : 0.6,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    // Auto-scroll to keep active tab visible
    if (tabCalculations.needsScroll && scrollViewRef.current) {
      const scrollOffset = Math.max(
        0,
        Math.min(
          activeIndex * tabWidth - SCREEN_WIDTH / 2 + tabWidth / 2,
          tabCalculations.totalWidth - SCREEN_WIDTH
        )
      );
      
      scrollViewRef.current.scrollTo({
        x: isRTL ? tabCalculations.totalWidth - SCREEN_WIDTH - scrollOffset : scrollOffset,
        animated: true,
      });
    }
  }, [tabCalculations, isRTL]);

  useEffect(() => {
    animateToActiveTab();
  }, [animateToActiveTab]);

  // Render floating camera button
  const renderFloatingCameraButton = () => {
    const cameraRoute = state.routes.find(
      (route: any) => route.name === "camera"
    );
    if (!cameraRoute) return null;

    const { cameraIndex } = tabCalculations;
    const { options } = descriptors[cameraRoute.key];
    const isFocused = state.index === cameraIndex;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: cameraRoute.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(cameraRoute.name);
      }
    };

    return (
      <View style={[styles.floatingCameraContainer, { [isRTL ? 'left' : 'right']: 20 }]}>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              isFocused
                ? [colors.emerald600, colors.emerald500]
                : [colors.emerald500, colors.emerald600]
            }
            style={styles.cameraGradient}
          >
            <Camera 
              size={28} 
              color="#FFFFFF" 
              strokeWidth={2.5}
            />
          </LinearGradient>
          
          {/* Pulse effect for camera */}
          <Animated.View style={[styles.cameraPulse, { backgroundColor: colors.emerald500 + '30' }]} />
        </TouchableOpacity>
        
        <Text style={[styles.cameraLabel, { color: isFocused ? colors.emerald600 : colors.textSecondary }]}>
          {t("tabs.camera")}
        </Text>
      </View>
    );
  };

  const dynamicStyles = createDynamicStyles(colors, isDark, isRTL);

  return (
    <SafeAreaView edges={["bottom"]} style={dynamicStyles.container}>
      <View style={dynamicStyles.tabBarWrapper}>
        {/* Modern glass morphism background */}
        <View style={dynamicStyles.backgroundBlur} />
        
        {/* Active tab indicator */}
        <Animated.View
          style={[
            dynamicStyles.activeIndicator,
            {
              transform: [{ translateX: indicatorAnim }],
            },
          ]}
        />

        {/* Scrollable tabs container */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            dynamicStyles.scrollContent,
            {
              width: Math.max(SCREEN_WIDTH, tabCalculations.totalWidth),
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
          style={dynamicStyles.scrollView}
          bounces={false}
          scrollEventThrottle={16}
        >
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel || options.title || route.name;
            const isFocused = state.index === index;
            const IconComponent = iconMap[route.name as keyof typeof iconMap] || Home;

            // Skip camera tab (rendered as floating button)
            if (route.name === "camera") {
              return (
                <View
                  key={route.key}
                  style={[dynamicStyles.tabItem, { width: tabCalculations.tabWidth }]}
                />
              );
            }

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                style={[
                  dynamicStyles.tabItem,
                  { width: tabCalculations.tabWidth },
                  isFocused && dynamicStyles.activeTab,
                ]}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={label}
              >
                <Animated.View
                  style={[
                    dynamicStyles.iconContainer,
                    {
                      transform: [
                        { scale: iconAnimations[index].scale },
                        { translateY: iconAnimations[index].translateY },
                      ],
                      opacity: iconAnimations[index].opacity,
                    },
                  ]}
                >
                  <IconComponent
                    size={TAB_ICON_SIZE}
                    color={isFocused ? colors.emerald600 : colors.textSecondary}
                    strokeWidth={isFocused ? 2.5 : 2}
                  />
                </Animated.View>

                <Animated.Text
                  style={[
                    dynamicStyles.tabLabel,
                    {
                      color: isFocused ? colors.emerald600 : colors.textSecondary,
                      fontWeight: isFocused ? "700" : "500",
                      opacity: iconAnimations[index].opacity,
                    },
                    isRTL && dynamicStyles.rtlText,
                  ]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {label}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Floating camera button */}
        {renderFloatingCameraButton()}
      </View>
    </SafeAreaView>
  );
}

const createDynamicStyles = (colors: any, isDark: boolean, isRTL: boolean) => {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    } as ViewStyle,
    
    tabBarWrapper: {
      position: 'relative',
      height: TAB_HEIGHT + (Platform.OS === 'ios' ? 0 : 10),
      backgroundColor: 'transparent',
    } as ViewStyle,

    backgroundBlur: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark 
        ? 'rgba(30, 41, 59, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTopWidth: 1,
      borderTopColor: isDark 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.05)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 8,
    } as ViewStyle,

    activeIndicator: {
      position: 'absolute',
      top: 0,
      width: 40,
      height: INDICATOR_HEIGHT,
      backgroundColor: colors.emerald600,
      borderRadius: INDICATOR_HEIGHT / 2,
      shadowColor: colors.emerald600,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    } as ViewStyle,

    scrollView: {
      flex: 1,
    } as ViewStyle,

    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: 8,
      minHeight: TAB_HEIGHT,
    } as ViewStyle,

    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
      minHeight: TAB_HEIGHT - 16,
    } as ViewStyle,

    activeTab: {
      backgroundColor: isDark 
        ? 'rgba(16, 185, 129, 0.1)' 
        : 'rgba(16, 185, 129, 0.05)',
      borderRadius: 12,
      marginHorizontal: 2,
    } as ViewStyle,

    iconContainer: {
      marginBottom: 4,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    tabLabel: {
      fontSize: 11,
      textAlign: 'center',
      letterSpacing: 0.2,
      lineHeight: 14,
    } as TextStyle,

    rtlText: {
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    } as TextStyle,

    // Floating camera button styles
    floatingCameraContainer: {
      position: 'absolute',
      top: -30,
      alignItems: 'center',
      zIndex: 10,
    } as ViewStyle,

    cameraButton: {
      width: CAMERA_BUTTON_SIZE,
      height: CAMERA_BUTTON_SIZE,
      borderRadius: CAMERA_BUTTON_SIZE / 2,
      marginBottom: 4,
      position: 'relative',
      overflow: 'hidden',
    } as ViewStyle,

    cameraGradient: {
      width: CAMERA_BUTTON_SIZE,
      height: CAMERA_BUTTON_SIZE,
      borderRadius: CAMERA_BUTTON_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.background,
      shadowColor: colors.emerald600,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    } as ViewStyle,

    cameraPulse: {
      position: 'absolute',
      width: CAMERA_BUTTON_SIZE + 20,
      height: CAMERA_BUTTON_SIZE + 20,
      borderRadius: (CAMERA_BUTTON_SIZE + 20) / 2,
      top: -10,
      left: -10,
      opacity: 0.3,
    } as ViewStyle,

    cameraLabel: {
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
      letterSpacing: 0.2,
    } as TextStyle,
  });
};

const styles = StyleSheet.create({
  floatingCameraContainer: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
    zIndex: 10,
  },
  cameraButton: {
    width: CAMERA_BUTTON_SIZE,
    height: CAMERA_BUTTON_SIZE,
    borderRadius: CAMERA_BUTTON_SIZE / 2,
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cameraGradient: {
    width: CAMERA_BUTTON_SIZE,
    height: CAMERA_BUTTON_SIZE,
    borderRadius: CAMERA_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraPulse: {
    position: 'absolute',
    width: CAMERA_BUTTON_SIZE + 20,
    height: CAMERA_BUTTON_SIZE + 20,
    borderRadius: (CAMERA_BUTTON_SIZE + 20) / 2,
    top: -10,
    left: -10,
    opacity: 0.3,
  },
  cameraLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ScrollableTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}