export default function PaddedLayout({ children }: { readonly children: React.ReactNode }) {
    return <div className="p-4">{children}</div>;
}
