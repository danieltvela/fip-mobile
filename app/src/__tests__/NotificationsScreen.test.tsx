import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationsScreen } from '../../app/notifications-screen';

const API = 'http://test';

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function page(items: unknown[], hasMore: boolean, unreadCount: number) {
  return jsonResponse({
    items,
    page: 1,
    pageSize: 20,
    total: items.length,
    hasMore,
    unreadCount,
  });
}

const UNREAD = {
  id: 'n1',
  typology: 'incident',
  title: 'Access change',
  body: 'Gate B.',
  receivedAt: '2026-09-27T11:00:00.000Z',
  readAt: null,
};

const READ = { ...UNREAD, id: 'n2', title: 'Forum conclusions', readAt: '2026-09-27T10:00:00.000Z' };

describe('NotificationsScreen', () => {
  it('shows the unread badge count, unread highlight and typology signage', async () => {
    fetchMock.mockResolvedValueOnce(page([UNREAD, READ], false, 1));
    render(<NotificationsScreen apiBaseUrl={API} />);

    expect(await screen.findByTestId('unread-badge')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    // Typology signage renders the human label of the typology.
    expect(screen.getAllByText('Incident').length).toBeGreaterThan(0);
    // Unread item is highlighted (accent border), read item is not.
    const unreadCard = screen.getByTestId('notification-n1');
    expect(unreadCard.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ borderColor: '#d92626' })]),
    );
    const readCard = screen.getByTestId('notification-n2');
    expect(readCard.props.style[0]).toEqual(expect.objectContaining({ borderColor: 'transparent' }));
    expect(readCard.props.style[1]).toBeFalsy();
  });

  it('marks a notification as read on open and the badge counter updates', async () => {
    fetchMock.mockResolvedValueOnce(page([UNREAD, READ], false, 1));
    fetchMock.mockResolvedValueOnce(jsonResponse({ unreadCount: 0 }));
    render(<NotificationsScreen apiBaseUrl={API} />);

    await screen.findByTestId('unread-badge');
    fireEvent.press(screen.getByTestId('notification-n1'));

    await waitFor(() => expect(screen.queryByTestId('unread-badge')).toBeNull());
    const patched = fetchMock.mock.calls.find((call) => String(call[0]).includes('/notifications/n1/read'));
    expect(patched?.[1]).toEqual(expect.objectContaining({ method: 'PATCH' }));
  });

  it('loads more pages while scrolling the browsable history', async () => {
    fetchMock.mockResolvedValueOnce(page([UNREAD], true, 0));
    fetchMock.mockResolvedValueOnce(page([{ ...READ, id: 'n3' }], false, 0));
    render(<NotificationsScreen apiBaseUrl={API} />);

    await screen.findByTestId('notification-n1');
    fireEvent(screen.getByTestId('notifications-list'), 'onEndReached');

    await waitFor(() => expect(screen.getByTestId('notification-n3')).toBeTruthy());
    expect(fetchMock.mock.calls.filter((call) => String(call[0]).includes('page=2'))).toHaveLength(1);
  });
});
