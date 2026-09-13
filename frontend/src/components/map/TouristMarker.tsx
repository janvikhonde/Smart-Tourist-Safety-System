/**
 * TouristMarker — places a tourist marker on a Google Maps instance.
 * Returns a handle to update position or remove the marker.
 */

export type TouristStatus = 'ACTIVE' | 'INACTIVE' | 'EMERGENCY'

export interface TouristMarkerOptions {
  map: google.maps.Map
  touristId: string  // e.g. TRS-4821
  name: string
  lat: number
  lng: number
  status: TouristStatus
}

export interface TouristMarkerHandle {
  marker: google.maps.Marker
  updatePosition: (lat: number, lng: number) => void
  updateStatus: (status: TouristStatus) => void
  clear: () => void
}

const STATUS_COLORS: Record<TouristStatus, string> = {
  ACTIVE:    '#38bdf8',
  INACTIVE:  '#475569',
  EMERGENCY: '#f43f5e',
}

const STATUS_SCALE: Record<TouristStatus, number> = {
  ACTIVE:    7,
  INACTIVE:  5,
  EMERGENCY: 10,
}

export function placeTouristMarker(opts: TouristMarkerOptions): TouristMarkerHandle {
  const { map, touristId, name, lat, lng, status } = opts
  const color = STATUS_COLORS[status]

  const marker = new window.google.maps.Marker({
    map,
    position: { lat, lng },
    title: `${name} (${touristId})`,
    icon: buildIcon(status),
    zIndex: status === 'EMERGENCY' ? 100 : 20,
    animation:
      status === 'EMERGENCY'
        ? window.google.maps.Animation.BOUNCE
        : undefined,
  })

  const infoWindow = new window.google.maps.InfoWindow({
    content: buildContent(touristId, name, status, color),
  })

  marker.addListener('click', () => infoWindow.open(map, marker))

  const updatePosition = (newLat: number, newLng: number) => {
    marker.setPosition({ lat: newLat, lng: newLng })
  }

  const updateStatus = (newStatus: TouristStatus) => {
    marker.setIcon(buildIcon(newStatus))
    marker.setZIndex(newStatus === 'EMERGENCY' ? 100 : 20)
    if (newStatus === 'EMERGENCY') {
      marker.setAnimation(window.google.maps.Animation.BOUNCE)
    } else {
      marker.setAnimation(null)
    }
    infoWindow.setContent(
      buildContent(touristId, name, newStatus, STATUS_COLORS[newStatus])
    )
  }

  const clear = () => {
    marker.setMap(null)
    infoWindow.close()
  }

  return { marker, updatePosition, updateStatus, clear }
}

function buildIcon(status: TouristStatus): google.maps.Symbol {
  const color = STATUS_COLORS[status]
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: STATUS_SCALE[status],
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: status === 'EMERGENCY' ? 3 : 2,
    strokeColor: status === 'EMERGENCY' ? '#ffffff' : '#0d1525',
  }
}

function buildContent(
  id: string,
  name: string,
  status: TouristStatus,
  color: string
): string {
  return `
    <div style="font-family:'DM Sans',sans-serif;padding:8px 4px;min-width:160px">
      <p style="font-weight:700;font-size:13px;margin:0 0 3px;color:#e2e8f0">${name}</p>
      <p style="font-size:11px;color:#64748b;margin:0 0 6px">
        ID: <span style="color:#38bdf8;font-weight:600">${id}</span>
      </p>
      <p style="
        display:inline-block;font-size:10px;font-weight:700;
        background:${color}20;color:${color};
        padding:2px 8px;border-radius:20px;border:1px solid ${color}40;margin:0;
      ">${status}</p>
    </div>
  `
}