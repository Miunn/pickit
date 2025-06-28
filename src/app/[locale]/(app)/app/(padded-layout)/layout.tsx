export default function PaddedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-4">
            {children}
        </div>
    )
}