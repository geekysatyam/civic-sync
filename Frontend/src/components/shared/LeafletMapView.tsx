import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  id?: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  /** When set, popup includes a link to open the issue (e.g. `/issue/abc`). */
  linkTo?: string;
}

interface Props {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  /** Pixel height of the map (Leaflet needs explicit dimensions). */
  height?: number;
  onPick?: (lat: number, lng: number) => void;
  footnote?: string;
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center[0], center[1], zoom, map]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MarkerPopupContent({ label, linkTo }: { label: string; linkTo?: string }) {
  return (
    <div className="space-y-1.5 min-w-[140px]">
      <p className="text-sm font-medium leading-snug">{label}</p>
      {linkTo ? (
        <Link to={linkTo} className="text-xs font-semibold text-primary hover:underline">
          View issue details →
        </Link>
      ) : null}
    </div>
  );
}

/** OpenStreetMap tiles + optional click-to-pick + complaint markers. */
const LeafletMapView = ({ center, zoom = 13, markers = [], className, height = 240, onPick, footnote }: Props) => {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  const validMarkers = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));

  return (
    <div className="space-y-2 w-full">
      <div className={cn('rounded-xl overflow-hidden border bg-muted w-full isolate', className)} style={{ height }}>
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter center={center} zoom={zoom} />
          {onPick && (
            <>
              <MapClickHandler onPick={onPick} />
              <Marker position={center}>
                <Popup>Selected location — tap elsewhere to move</Popup>
              </Marker>
            </>
          )}
          {validMarkers.map((m, i) => {
            const key = m.id ?? `${m.lat}-${m.lng}-${i}`;
            if (m.color) {
              return (
                <CircleMarker
                  key={key}
                  center={[m.lat, m.lng]}
                  radius={9}
                  pathOptions={{
                    color: m.color,
                    fillColor: m.color,
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <MarkerPopupContent label={m.label} linkTo={m.linkTo} />
                  </Popup>
                </CircleMarker>
              );
            }
            return (
              <Marker key={key} position={[m.lat, m.lng]}>
                <Popup>
                  <MarkerPopupContent label={m.label} linkTo={m.linkTo} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      {footnote ? <p className="text-xs text-muted-foreground leading-relaxed px-0.5">{footnote}</p> : null}
    </div>
  );
};

export default LeafletMapView;
