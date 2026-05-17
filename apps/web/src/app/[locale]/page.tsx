/**
 * 首页重定向
 * 自动跳转到 Dashboard
 */
import { redirect } from 'next/navigation';

export default function Home({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/dashboard`);
}
