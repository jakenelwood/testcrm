import React from 'react';
import { useDownloadDocument } from '../lib/hooks/useDocuments';
import { Button } from './ui/button';
import { Icons } from './icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './empty-state';

export interface Document {
  id: string;
  filename: string;
  createdAt: string;
  fileType: 'docx' | 'pdf';
  downloadUrl: string;
}

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  isError,
  errorMessage,
}) => {
  const { mutate: downloadDocument, isPending: isDownloading } = useDownloadDocument();

  const handleDownload = (document: Document) => {
    downloadDocument({ id: document.id, filename: document.filename });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-3">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="mb-3 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{errorMessage || 'An error occurred while loading documents. Please try again.'}</p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon="fileText"
        title="No documents yet"
        description="Generated documents will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Document History</h3>
      {documents.map((document) => (
        <Card key={document.id} className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{document.filename}</CardTitle>
            <CardDescription>
              Created {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Type: <span className="uppercase">{document.fileType}</span>
            </p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(document)}
              disabled={isDownloading}
              className="w-full sm:w-auto"
            >
              {isDownloading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Icons.download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}; 