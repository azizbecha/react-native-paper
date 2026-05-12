import * as React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { act, render } from '@testing-library/react-native';

import { red200, white } from '../../theme/colors';
import Snackbar from '../Snackbar';

const styles = StyleSheet.create({
  snackContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconView: {
    backgroundColor: red200,
    padding: 15,
  },
  text: { color: white, marginLeft: 10, flexWrap: 'wrap', flexShrink: 1 },
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 34, left: 0, right: 0, top: 47 }),
}));

// Silences the `children` deprecation warning for tests that exercise the
// (still-supported) deprecated path.
const mockConsoleWarn = () =>
  jest.spyOn(console, 'warn').mockImplementation(() => {});

it('renders snackbar with content', () => {
  const tree = render(
    <Snackbar visible onDismiss={jest.fn()} message="Snackbar content" />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});

it('renders not visible snackbar with content wrapper but no actual content', () => {
  const tree = render(
    <Snackbar
      visible={false}
      onDismiss={jest.fn()}
      message="Snackbar content"
    />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});

it('renders snackbar with Text as a child', () => {
  const warn = mockConsoleWarn();
  const tree = render(
    <Snackbar visible onDismiss={jest.fn()}>
      <Text>Snackbar content</Text>
    </Snackbar>
  ).toJSON();

  expect(tree).toMatchSnapshot();
  warn.mockRestore();
});

it('renders snackbar with action button', () => {
  const tree = render(
    <Snackbar
      visible
      onDismiss={() => {}}
      message="Snackbar content"
      action={{ label: 'Undo', onPress: jest.fn() }}
    />
  ).toJSON();

  expect(tree).toMatchSnapshot();
});

it('renders snackbar with View & Text as a child', () => {
  const warn = mockConsoleWarn();
  const tree = render(
    <Snackbar visible onDismiss={jest.fn()}>
      <View style={styles.snackContent}>
        <View style={styles.iconView} />
        <Text style={styles.text}>
          Error Message which is veryyyyyyyyyyyy longggggggg Error Message which
          is veryyyyyyyyyyyy longggggggg
        </Text>
      </View>
    </Snackbar>
  ).toJSON();

  expect(tree).toMatchSnapshot();
  warn.mockRestore();
});

describe('message prop', () => {
  it('renders the message text', () => {
    const { getByText } = render(
      <Snackbar visible onDismiss={jest.fn()} message="Hello there" />
    );

    expect(getByText('Hello there')).toBeTruthy();
  });

  it('takes precedence over children', () => {
    const warn = mockConsoleWarn();
    const { getByText, queryByText } = render(
      <Snackbar visible onDismiss={jest.fn()} message="From message">
        From children
      </Snackbar>
    );

    expect(getByText('From message')).toBeTruthy();
    expect(queryByText('From children')).toBeNull();
    warn.mockRestore();
  });
});

describe('deprecated children prop', () => {
  it('still renders the children as the message', () => {
    const warn = mockConsoleWarn();
    const { getByText } = render(
      <Snackbar visible onDismiss={jest.fn()}>
        Legacy content
      </Snackbar>
    );

    expect(getByText('Legacy content')).toBeTruthy();
    warn.mockRestore();
  });

  it('warns about the deprecation', () => {
    const warn = mockConsoleWarn();
    render(
      <Snackbar visible onDismiss={jest.fn()}>
        Legacy content
      </Snackbar>
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('`children` prop is deprecated')
    );
    warn.mockRestore();
  });
});

it('animated value changes correctly', () => {
  const value = new Animated.Value(1);
  const { getByTestId } = render(
    <Snackbar
      visible
      onDismiss={jest.fn()}
      testID="snack-bar"
      message="Snackbar content"
      style={[{ transform: [{ scale: value }] }]}
    />
  );
  expect(getByTestId('snack-bar-outer-layer')).toHaveStyle({
    transform: [{ scale: 1 }],
  });

  Animated.timing(value, {
    toValue: 1.5,
    useNativeDriver: false,
    duration: 200,
  }).start();

  act(() => {
    jest.advanceTimersByTime(200);
  });
  expect(getByTestId('snack-bar-outer-layer')).toHaveStyle({
    transform: [{ scale: 1.5 }],
  });
});
