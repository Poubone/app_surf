import { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { MapPin } from '../types';
import { LEAFLET_MAP_HTML } from './leaflet-map-html';

export function LeafletMap({
  pins,
  onPinPress,
}: {
  pins: MapPin[];
  onPinPress: (id: string) => void;
}) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  const pushPins = useCallback(() => {
    if (!readyRef.current || !webRef.current) return;
    webRef.current.injectJavaScript(`window.setPins(${JSON.stringify(pins)}); true;`);
    if (Platform.OS === 'android') {
      webRef.current.postMessage(JSON.stringify({ type: 'setPins', pins }));
    }
  }, [pins]);

  useEffect(() => {
    pushPins();
  }, [pushPins]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string };
      if (data.type === 'pin' && data.id) onPinPress(data.id);
    } catch {
      /* ignore */
    }
  }

  return (
    <WebView
      ref={webRef}
      style={styles.map}
      source={{ html: LEAFLET_MAP_HTML }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      allowsInlineMediaPlayback
      onLoadEnd={() => {
        readyRef.current = true;
        pushPins();
      }}
      onMessage={onMessage}
    />
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: '#070c16' },
});
