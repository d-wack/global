"use client";

import dynamic from "next/dynamic";

import { AtlasStageView } from "@/components/atlas-stage-view";
import { ChromeToggle } from "@/components/chrome/chrome-toggle";
import { ViewLogger } from "@/components/context/view-logger";
import { useChromeHotkey } from "@/hooks/use-chrome-hotkey";
import { AtlasProvider, useAtlas } from "@/state/atlas-context";

// MapLibre touches the DOM/WebGL and must not render on the server.
const GlobeMap = dynamic(() => import("@/components/globe/globe-map"), {
  ssr: false,
});

/**
 * Full-screen shell that composes the globe and its overlays under a single
 * {@link AtlasProvider}. Immersive mode (the chrome toggle / `H` hotkey) hides
 * every overlay but the globe; the toggle itself and the headless view logger
 * stay mounted.
 */
export function AtlasView() {
  return (
    <AtlasProvider>
      <AtlasStage />
    </AtlasProvider>
  );
}

/** Connects the stage to context: reads immersive state, mounts the hotkey. */
function AtlasStage() {
  const { chromeVisible, toggleChrome } = useAtlas();
  useChromeHotkey();

  return (
    <>
      <AtlasStageView
        chromeVisible={chromeVisible}
        globe={<GlobeMap />}
        toggle={
          <ChromeToggle chromeVisible={chromeVisible} onToggle={toggleChrome} />
        }
      />
      <ViewLogger />
    </>
  );
}
