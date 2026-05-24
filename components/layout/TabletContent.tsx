import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import { TABLET_MAX_CONTENT_WIDTH } from '@/lib/presentation/tabletLayout';

type TabletContentProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** When true, inner column stretches to max width even on phone (useful for modals). */
  fullWidth?: boolean;
};

/** Centers content and caps width on iPad so layouts do not stretch edge-to-edge. */
export function TabletContent({ children, style, fullWidth = false }: TabletContentProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_MAX_CONTENT_WIDTH + 48;
  const maxWidth = fullWidth || isWide ? Math.min(TABLET_MAX_CONTENT_WIDTH, width - 32) : width;

  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, { maxWidth, width: '100%' }]}>{children}</View>
    </View>
  );
}

export function useIsWideLayout(): boolean {
  const { width } = useWindowDimensions();
  return width >= TABLET_MAX_CONTENT_WIDTH + 48;
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    alignSelf: 'center',
  },
});
