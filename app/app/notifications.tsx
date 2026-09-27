import { NotificationsScreen } from './notifications-screen';

export default function NotificationsRoute() {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
  return <NotificationsScreen apiBaseUrl={apiBaseUrl} />;
}
