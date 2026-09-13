/**
 * ZoneCircle — renders a geo-fence circle + marker on a Google Maps instance.
 * Not a React DOM element — it uses the Maps JS API imperatively.
 * Usage: call drawZone() after the map is ready, call clear() to remove.
 */

export type ZoneStatus = 'SAFE' | 'WARNING' | 'DANGER'

export interface ZoneCircleOptions {
  map: google.maps.Map
  centerLat: number
  centerLng: number
  radiusMeters: number
  status: ZoneStatus
  name: string
  touristCount: number
}

const STATUS_COLORS: Record<ZoneStatus, string> = {
  SAFE:    '#34d399',
  WARNING: '#f59e0b',
  DANGER:  '#f43f5e',
}

export interface ZoneCircleHandle {
  circle: google.maps.Circle
  marker: google.maps.Marker
  infoWindow: google.maps.InfoWindow
  clear: () => void
  updateStatus: (status: ZoneStatus, count: number) => void
}

export function drawZone(opts: ZoneCircleOptions): ZoneCircleHandle {
  const { map, centerLat, centerLng, radiusMeters, status, name, touristCount } = opts
  const color = STATUS_COLORS[status]
  const center = { lat: centerLat, lng: centerLng }

  const circle = new window.google.maps.Circle({
    map,
    center,
    radius: radiusMeters,
    strokeColor:   color,
    strokeOpacity: 0.85,
    strokeWeight:  2,
    fillColor:     color,
    fillOpacity:   0.07,
    clickable:     false,
  })

  const marker = new window.google.maps.Marker({
    map,
    position: center,
    title: name,
    icon: {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 2.5,
      strokeColor: '#ffffff',
    },
    zIndex: 10,
  })

  const infoWindow = new window.google.maps.InfoWindow({
    content: buildInfoContent(name, touristCount, status, color),
  })

  marker.addListener('click', () => infoWindow.open(map, marker))
  marker.addListener('mouseover', () => infoWindow.open(map, marker))

  const clear = () => {
    circle.setMap(null)
    marker.setMap(null)
    infoWindow.close()
  }

  const updateStatus = (newStatus: ZoneStatus, newCount: number) => {
    const newColor = STATUS_COLORS[newStatus]
    circle.setOptions({
      strokeColor: newColor,
      fillColor:   newColor,
    })
    marker.setIcon({
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: newColor,
      fillOpacity: 1,
      strokeWeight: 2.5,
      strokeColor: '#ffffff',
    })
    infoWindow.setContent(buildInfoContent(name, newCount, newStatus, newColor))
  }

  return { circle, marker, infoWindow, clear, updateStatus }
}

function buildInfoContent(
  name: string,
  count: number,
  status: ZoneStatus,
  color: string
): string {
  return `
    <div style="
      font-family:'DM Sans',sans-serif;
      padding:8px 4px;
      min-width:160px;
      background:#111d35;
      color:#e2e8f0;
      border-radius:8px;
    ">
      <p style="font-weight:700;font-size:13px;margin:0 0 6px">${name}</p>
      <p style="font-size:11px;color:#64748b;margin:0 0 3px">👥 ${count} tourists inside</p>
      <p style="
        display:inline-block;font-size:10px;font-weight:700;
        background:${color}20;color:${color};
        padding:2px 8px;border-radius:20px;border:1px solid ${color}40;
        margin:0;
      ">${status}</p>
    </div>
  `
}