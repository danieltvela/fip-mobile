import { PressRoomScreen } from './press-room-screen';

export default function PressRoomRoute() {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
  return <PressRoomScreen apiBaseUrl={apiBaseUrl} />;
}
