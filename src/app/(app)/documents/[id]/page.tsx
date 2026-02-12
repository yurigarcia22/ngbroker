// server component
import { DocumentEditor } from '@/components/documents/document-editor'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <DocumentEditor initialId={id} />
}
