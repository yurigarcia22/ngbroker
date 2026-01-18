import { DocumentSidebar } from '@/components/documents/document-sidebar'

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full">
            <DocumentSidebar />
            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
        </div>
    )
}
