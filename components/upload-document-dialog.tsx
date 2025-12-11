'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { uploadSingleDocument } from '@/lib/documents/upload';
import { MAX_FILE_SIZE } from '@/lib/documents/constants';
import { useRouter } from 'next/navigation';

type FileStatus = 'pending' | 'uploading' | 'success' | 'error';

interface FileWithStatus {
  file: File;
  id: string;
  status: FileStatus;
  error?: string;
}

export function UploadDocumentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Calculate progress
  const totalFiles = files.length;
  const completedFiles = files.filter((f) => f.status === 'success' || f.status === 'error').length;
  const progressPercent = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  // Handle dropzone - accept multiple files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithStatus[] = acceptedFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending' as FileStatus,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true, // Enable multiple file selection
  });

  // Handle file rejections
  useEffect(() => {
    if (fileRejections.length > 0) {
      fileRejections.forEach((rejection) => {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          toast.error(`${rejection.file.name}: File size exceeds 10MB`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${rejection.file.name}: Invalid file type`);
        }
      });
    }
  }, [fileRejections]);

  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
  };

  // Upload all files sequentially with progress updates
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Process files one by one with proper awaiting
    for (let i = 0; i < files.length; i++) {
      const fileWithStatus = files[i];
      if (fileWithStatus.status !== 'pending') continue;

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithStatus.id ? { ...f, status: 'uploading' as FileStatus } : f
        )
      );

      // Actually await the upload
      try {
        const result = await uploadSingleDocument(fileWithStatus.file);

        // Update status based on result
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithStatus.id
              ? {
                  ...f,
                  status: result.success ? ('success' as FileStatus) : ('error' as FileStatus),
                  error: result.error,
                }
              : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithStatus.id
              ? { ...f, status: 'error' as FileStatus, error: 'Upload failed' }
              : f
          )
        );
      }

      // Small delay to allow UI to update and show progress
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    setIsUploading(false);
  };

  // Check if all uploads are complete
  const allComplete =
    files.length > 0 && files.every((f) => f.status === 'success' || f.status === 'error');
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  // Show summary toast when all complete
  useEffect(() => {
    if (allComplete && files.length > 0) {
      if (errorCount === 0) {
        toast.success(`Successfully uploaded ${successCount} document(s)`);
      } else {
        toast.warning(`Uploaded ${successCount}, failed ${errorCount}`);
      }
      router.refresh();
    }
  }, [allComplete, successCount, errorCount, files.length, router]);

  // Reset when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setFiles([]);
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload financial documents (PDF, JPEG, or PNG). Our AI will automatically classify and
            extract the data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
              isUploading && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps()} disabled={isUploading} />
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
              <p className="text-xs text-muted-foreground">PDF, JPEG, or PNG (max 10MB each)</p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </span>
                {!isUploading && !allComplete && (
                  <Button variant="ghost" size="sm" onClick={clearFiles}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {completedFiles} / {totalFiles} complete
                  </p>
                </div>
              )}

              {/* File items */}
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {files.map((fileWithStatus) => (
                    <div
                      key={fileWithStatus.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-md border',
                        fileWithStatus.status === 'success' && 'bg-green-500/5 border-green-500/20',
                        fileWithStatus.status === 'error' &&
                          'bg-destructive/5 border-destructive/20'
                      )}
                    >
                      {getStatusIcon(fileWithStatus.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileWithStatus.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fileWithStatus.error || formatFileSize(fileWithStatus.file.size)}
                        </p>
                      </div>
                      {fileWithStatus.status === 'pending' && !isUploading && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(fileWithStatus.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isUploading}
            >
              {allComplete ? 'Close' : 'Cancel'}
            </Button>
            {!allComplete && (
              <Button onClick={handleUpload} disabled={files.length === 0 || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {files.length > 0 && `(${files.length})`}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
