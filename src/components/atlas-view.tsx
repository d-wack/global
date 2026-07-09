"use client";

import dynamic from "next/dynamic";

import { AtlasStageView } from "@/components/atlas-stage-view";
import { ViewLogger } from "@/components/context/view-logger";
import { useChromeHotkey } from "@/hooks/use-chrome-hotkey";
import { AtlasProvider } from "@/state/atlas-context";

// MapLibre touches the DOM/WebGL and must not render on the server.
const GlobeMap = dynamic(() => import("@/components/globe/globe-map"), {
  ssr: false,
});

/**
 * Full-screen shell that composes the globe and its overlays under a single
 * {@link AtlasProvider}. Immersive mode (the toolbar toggle / `H` hotkey) hides
 * every overlay but the globe; the tool column (which carries the toggle) and
 * the headless view logger stay mounted.
 */
export function AtlasView() {
  return (
    <AtlasProvider>
      <AtlasStage />
    </AtlasProvider>
  );
}

/** Mounts the immersive-mode hotkey and composes the stage + headless logger. */
function AtlasStage() {
  useChromeHotkey();

  return (
    <>
      <AtlasStageView globe={<GlobeMap />} />
      <ViewLogger />
    </>
  );
}
