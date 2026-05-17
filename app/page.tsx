import { redirect } from 'next/navigation';

// CONCEPT MODE: redirect straight to app
export default function Home() {
  redirect('/home');
}
