import type { PlaceInfoProvider } from "./place-info-provider";
import { WikipediaPlaceInfo } from "./wikipedia-place-info";

/** The single place that chooses a concrete {@link PlaceInfoProvider}. */
let instance: PlaceInfoProvider | undefined;

export function getPlaceInfoProvider(): PlaceInfoProvider {
  instance ??= new WikipediaPlaceInfo();
  return instance;
}

export type { PlaceInfoProvider, PlaceInfoResult } from "./place-info-provider";
