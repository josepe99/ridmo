import { redirect } from 'next/navigation';

export default function OAuthCallbackPage() {
  // Server-side redirect to home page
  redirect('/');
}