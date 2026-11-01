import { SiteHeader, SiteFooter } from "@/components/site/Chrome";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader />{children}<SiteFooter /></>);
}
