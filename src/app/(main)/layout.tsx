import { TopHeader } from "@/components/layout/TopHeader";
import { MobileNav } from "@/components/layout/MobileNav";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <TopHeader />
            <main className="flex-1 pb-20 sm:pb-0 min-h-screen bg-slate-50/50">
                {children}
            </main>
            <MobileNav />
        </>
    );
}
