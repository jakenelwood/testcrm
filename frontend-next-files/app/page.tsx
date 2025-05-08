import { redirect } from 'next/navigation';

export default function Home() {
  // For now, just redirect to login page
  redirect('/auth/login');
}
