import type { Geocoder } from "./geocoder";
import { NominatimGeocoder } from "./nominatim-geocoder";

/** The single place that chooses a concrete {@link Geocoder}. */
let instance: Geocoder | undefined;

export function getGeocoder(): Geocoder {
  instance ??= new NominatimGeocoder();
  return instance;
}

export type { Geocoder, GeocodeResult } from "./geocoder";
