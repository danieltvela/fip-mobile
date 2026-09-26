import { LoginPrompt } from './login-form';

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: 16 }}>
      <h1>FIP Press Panel</h1>
      <p>Sign in with a press team account.</p>
      <LoginPrompt />
    </main>
  );
}
