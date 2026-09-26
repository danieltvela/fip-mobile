import React from 'react';
import { render, screen } from '@testing-library/react-native';

import CredentialScreen from '../../app/credential';

describe('CredentialScreen activation gate', () => {
  it('hides the credential while it is not activated', () => {
    render(<CredentialScreen />);
    expect(screen.getByText('Credential not activated')).toBeTruthy();
    expect(screen.queryByText('Press credential')).toBeNull();
  });
});
