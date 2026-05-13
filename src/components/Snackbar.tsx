import * as React from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  I18nManager,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useLatestCallback from 'use-latest-callback';

import Button from './Button/Button';
import type { IconSource } from './Icon';
import IconButton from './IconButton/IconButton';
import MaterialCommunityIcon from './MaterialCommunityIcon';
import Surface from './Surface';
import Text from './Typography/Text';
import { useInternalTheme } from '../core/theming';
import type { $Omit, Theme, ThemeProp } from '../types';

export type Props = $Omit<
  React.ComponentProps<typeof Surface>,
  'mode' | 'children'
> & {
  /**
   * Whether the Snackbar is currently visible.
   */
  visible: boolean;
  /**
   * Configuration for the action button. It can contain the following properties:
   * - `label` - Label of the action button (required).
   * - `onPress` - Callback that is called when the action button is pressed. The Snackbar is also dismissed.
   * - `labelStyle` - Style for the action button's label.
   * - `accessibilityLabel` - Accessibility label for the action button.
   */
  action?: {
    label: string;
    onPress?: (e: GestureResponderEvent) => void;
    labelStyle?: StyleProp<TextStyle>;
    accessibilityLabel?: string;
  };
  /**
   * @supported Available in v5.x with theme version 3
   * Icon to display when `onIconPress` is defined. Default will be `close` icon.
   */
  icon?: IconSource;
  /**
   * Function to execute on icon button press. The icon button appears only when this prop is specified.
   */
  onIconPress?: () => void;
  /**
   * @supported Available in v5.x with theme version 3
   * Accessibility label for the icon button. This is read by the screen reader when the user taps the button.
   */
  iconAccessibilityLabel?: string;
  /**
   * The duration for which the Snackbar is shown.
   */
  duration?: number;
  /**
   * Callback called when Snackbar is dismissed. The `visible` prop needs to be updated when this is called.
   */
  onDismiss: () => void;
  /**
   * Text content of the Snackbar.
   */
  message?: string;
  /**
   * @deprecated Use `message` instead. When both `message` and `children` are set, `message` is used.
   * Text content of the Snackbar.
   */
  children?: React.ReactNode;
  /**
   * @supported Available in v5.x with theme version 3
   * Changes Snackbar shadow and background on iOS and Android.
   */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5 | Animated.Value;
  /**
   * Specifies the largest possible scale a text font can reach.
   */
  maxFontSizeMultiplier?: number;
  /**
   * Style for the wrapper of the snackbar
   */
  wrapperStyle?: StyleProp<ViewStyle>;
  /**
   * Style for the content of the snackbar
   */
  contentStyle?: StyleProp<ViewStyle>;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  ref?: React.RefObject<View>;
  /**
   * @optional
   */
  theme?: ThemeProp;
  /**
   * TestID used for testing purposes
   */
  testID?: string;
};

const DURATION_SHORT = 4000;
const DURATION_MEDIUM = 7000;
const DURATION_LONG = 10000;

/**
 * Snackbars provide brief feedback about an operation through a message rendered at the bottom of the container in which it's wrapped.
 *
 * Note: To display it as a popup, regardless of the parent's position, wrap it with a `Portal` component – refer to the example in the "More Examples` section.
 *
 * ## Usage
 * ```js
 * import * as React from 'react';
 * import { View, StyleSheet } from 'react-native';
 * import { Button, Snackbar } from 'react-native-paper';
 *
 * const MyComponent = () => {
 *   const [visible, setVisible] = React.useState(false);
 *
 *   const onToggleSnackBar = () => setVisible(!visible);
 *
 *   const onDismissSnackBar = () => setVisible(false);
 *
 *   return (
 *     <View style={styles.container}>
 *       <Button onPress={onToggleSnackBar}>{visible ? 'Hide' : 'Show'}</Button>
 *       <Snackbar
 *         visible={visible}
 *         onDismiss={onDismissSnackBar}
 *         message="Hey there! I'm a Snackbar."
 *         action={{
 *           label: 'Undo',
 *           onPress: () => {
 *             // Do something
 *           },
 *         }}
 *       />
 *     </View>
 *   );
 * };
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *     justifyContent: 'space-between',
 *   },
 * });
 *
 * export default MyComponent;
 * ```
 */
const Snackbar = ({
  visible,
  action,
  icon,
  onIconPress,
  iconAccessibilityLabel = 'Close icon',
  duration = DURATION_MEDIUM,
  onDismiss,
  message,
  children,
  elevation = 3,
  style,
  wrapperStyle,
  contentStyle,
  theme: themeOverrides,
  maxFontSizeMultiplier,
  testID,
  ...rest
}: Props) => {
  const theme = useInternalTheme(themeOverrides);
  const { bottom, right, left } = useSafeAreaInsets();

  if (process.env.NODE_ENV !== 'production' && children != null) {
    console.warn(
      'Snackbar: the `children` prop is deprecated and will be removed in a future release. Use the `message` prop instead.'
    );
  }

  const messageContent = message != null ? message : children;

  const { current: opacity } = React.useRef<Animated.Value>(
    new Animated.Value(0.0)
  );
  const hideTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const [hidden, setHidden] = React.useState(!visible);

  const { scale } = theme.animation;

  const animateShow = useLatestCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    opacity.stopAnimation();

    Animated.timing(opacity, {
      toValue: 1,
      duration: 200 * scale,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        const isInfinity =
          duration === Number.POSITIVE_INFINITY ||
          duration === Number.NEGATIVE_INFINITY;

        if (!isInfinity) {
          hideTimeout.current = setTimeout(
            onDismiss,
            duration
          ) as unknown as NodeJS.Timeout;
        }
      }
    });
  });

  const handleOnVisible = useLatestCallback(() => {
    // show
    setHidden(false);
  });

  const handleOnHidden = useLatestCallback(() => {
    // hide
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    opacity.stopAnimation();

    Animated.timing(opacity, {
      toValue: 0,
      duration: 100 * scale,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setHidden(true);
      }
    });
  });

  React.useEffect(() => {
    if (!hidden) {
      animateShow();
    }
  }, [animateShow, hidden]);

  React.useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  React.useLayoutEffect(() => {
    if (visible) {
      handleOnVisible();
    } else {
      handleOnHidden();
    }
  }, [visible, handleOnVisible, handleOnHidden]);

  const { buttonTextColor, textColor, backgroundColor } = React.useMemo(() => {
    const { colors } = theme as Theme;
    return {
      buttonTextColor: colors.inversePrimary,
      textColor: colors.inverseOnSurface,
      backgroundColor: colors.inverseSurface,
    };
  }, [theme]);

  const wrapperPaddings = React.useMemo(
    () => ({
      paddingBottom: bottom,
      paddingHorizontal: Math.max(left, right),
    }),
    [bottom, left, right]
  );

  const messageElement = React.useMemo(() => {
    if (typeof messageContent === 'string') {
      return (
        <Text
          variant="bodyMedium"
          style={[styles.content, { color: textColor }, contentStyle]}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
        >
          {messageContent}
        </Text>
      );
    }

    return (
      <View style={[styles.content, contentStyle]}>
        {/* Wrapper view enables multi-line support for an element passed as `children`. */}
        <View>{messageContent}</View>
      </View>
    );
  }, [messageContent, textColor, contentStyle, maxFontSizeMultiplier]);

  if (hidden) {
    return null;
  }

  const {
    label: actionLabel,
    onPress: onPressAction,
    labelStyle: actionLabelStyle,
    accessibilityLabel: actionAccessibilityLabel,
  } = action ?? {};

  const isIconButton = Boolean(onIconPress);
  const marginLeft = action ? -12 : -16;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, wrapperPaddings, wrapperStyle]}
    >
      <Surface
        pointerEvents="box-none"
        accessibilityLiveRegion="polite"
        theme={theme}
        style={[
          styles.container,
          {
            backgroundColor,
            borderRadius: (theme as Theme).shapes.corner.extraSmall,
            opacity: opacity,
            transform: [
              {
                scale: visible
                  ? opacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    })
                  : 1,
              },
            ],
          },
          style,
        ]}
        testID={testID}
        container
        elevation={elevation}
        {...rest}
      >
        {messageElement}
        {(action || isIconButton) && (
          <View style={[styles.actionsContainer, { marginLeft }]}>
            {action ? (
              <Button
                onPress={(event) => {
                  onPressAction?.(event);
                  onDismiss();
                }}
                style={styles.button}
                labelStyle={actionLabelStyle}
                accessibilityLabel={actionAccessibilityLabel}
                textColor={buttonTextColor}
                compact={false}
                mode="text"
                theme={theme}
              >
                {actionLabel}
              </Button>
            ) : null}
            {isIconButton ? (
              <IconButton
                accessibilityRole="button"
                borderless
                onPress={onIconPress}
                iconColor={textColor}
                theme={theme}
                icon={
                  icon ||
                  (({ size, color }) => {
                    return (
                      <MaterialCommunityIcon
                        name="close"
                        color={color}
                        size={size}
                        direction={
                          I18nManager.getConstants().isRTL ? 'rtl' : 'ltr'
                        }
                      />
                    );
                  })
                }
                accessibilityLabel={iconAccessibilityLabel}
                style={styles.icon}
                testID={`${testID}-icon`}
              />
            ) : null}
          </View>
        )}
      </Surface>
    </View>
  );
};

/**
 * Show the Snackbar for a short duration.
 */
Snackbar.DURATION_SHORT = DURATION_SHORT;

/**
 * Show the Snackbar for a medium duration.
 */
Snackbar.DURATION_MEDIUM = DURATION_MEDIUM;

/**
 * Show the Snackbar for a long duration.
 */
Snackbar.DURATION_LONG = DURATION_LONG;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 8,
    borderRadius: 4,
    minHeight: 48,
  },
  content: {
    marginHorizontal: 16,
    marginVertical: 14,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: 48,
  },
  button: {
    marginRight: 8,
    marginLeft: 4,
  },
  icon: {
    width: 40,
    height: 40,
    margin: 0,
  },
});

export default Snackbar;
