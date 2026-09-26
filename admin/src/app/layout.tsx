export const metadata = {
  title: 'FIP Press Admin',
  description: 'Management panel for the FIP press team',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
