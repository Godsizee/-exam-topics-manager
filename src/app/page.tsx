import { getTopicsAction } from '@/app/actions';
import TopicsManager from '@/components/TopicsManager';

// Force Next.js to render this page dynamically on every request to show live database updates
export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialTopics = await getTopicsAction();

  return <TopicsManager initialTopics={initialTopics} />;
}
