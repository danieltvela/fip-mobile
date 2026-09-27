import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('react-native-qrcode-svg', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ value }: { value: string }) => <Text testID="qr">qr:{value}</Text>,
  };
});

import { CredentialCard } from '../../components/CredentialCard';

const activated = {
  locatorCode: 'XFJH2356EH',
  fullName: 'Jane Doe',
  outlet: 'Diario Ejemplo',
  activated: true,
};

describe('CredentialCard', () => {
  it('shows locator code as QR payload, name, outlet, and legal notice', () => {
    render(<CredentialCard credential={activated} />);
    expect(screen.getByTestId('qr')).toHaveTextContent(`qr:${activated.locatorCode}`);
    expect(screen.getByText('XFJH2356EH')).toBeTruthy();
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText(/Diario Ejemplo/)).toBeTruthy();
    expect(screen.getByText(/does not replace the physical credential/i)).toBeTruthy();
  });
});
