import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata;
export default function AdminMetadataLayout({ children }: { children: React.ReactNode }) {
  return <div data-panel-palette="paper" className="panel-skin contents">{children}</div>;
}
