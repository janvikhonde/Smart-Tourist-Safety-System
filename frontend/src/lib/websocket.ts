import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/ws`

let client: Client | null = null

export const connectWebSocket = (
  onLocation: (msg: object) => void,
  onEmergency: (msg: object) => void
) => {
  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('✅ WebSocket connected')
      client?.subscribe('/topic/locations', (frame) => {
        onLocation(JSON.parse(frame.body))
      })
      client?.subscribe('/topic/emergency', (frame) => {
        onEmergency(JSON.parse(frame.body))
      })
    },
    onDisconnect: () => console.log('WebSocket disconnected'),
    onStompError: (frame) => console.error('STOMP error', frame),
  })
  client.activate()
}

export const sendLocationUpdate = (payload: object) => {
  client?.publish({
    destination: '/app/location.update',
    body: JSON.stringify(payload),
  })
}

export const disconnectWebSocket = () => {
  client?.deactivate()
  client = null
}