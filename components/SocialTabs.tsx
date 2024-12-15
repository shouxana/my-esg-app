'use client';

import React, { useState, useEffect } from 'react';
import { FormInput, BarChart2, FileText, Upload, X, Trash2, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams, useRouter } from 'next/navigation';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import DataInputForm from './DataInputForm';
import EducationChart from './EducationChart';
import GenderDistributionChart from './GenderDistributionChart';
import EmployeeFluctuationChart from './EmployeeFluctuationChart';
import LeaveTrackingChart from './EmployeeLeaveChart';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TabType {
  label: string;
  icon: React.ElementType;
  color: string;
}

interface PDFFile {
  id: string;
  name: string;
  uploadDate: string;
  size: string;
  url: string;
}

interface SocialTabsProps {
  company?: string;
  searchParams: ReadonlyURLSearchParams;
  router: ReturnType<typeof useRouter>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const SocialTabs: React.FC<SocialTabsProps> = ({ company, searchParams, router }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'visuals' | 'pdfs'>('input');
  const [years, setYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<PDFFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();

  const tabs: Record<'input' | 'visuals' | 'pdfs', TabType> = {
    input: {
      label: 'Data Input',
      icon: FormInput,
      color: 'text-blue-600 border-blue-600',
    },
    visuals: {
      label: 'Visuals',
      icon: BarChart2,
      color: 'text-blue-600 border-blue-600',
    },
    pdfs: {
      label: 'Uploaded Documents',
      icon: FileText,
      color: 'text-blue-600 border-blue-600',
    },
  };

  const fetchPDFs = async () => {
    if (!company) {
      toast({
        title: "Error",
        description: "Company information is required",
        variant: "destructive",
      });
      return;
    }
  
    setIsLoading(true);
    try {
      const section = activeTab === 'pdfs' ? 'social' : ''; // Use 'social' only for the 'pdfs' tab
      const response = await fetch(`/api/list-pdfs?company=${encodeURIComponent(company)}&section=${section}`);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch PDFs');
      }
  
      const data = await response.json();
      setPdfs(data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load PDFs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pdfs') {
      fetchPDFs();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchYears = async () => {
      if (!company) {
        setError('Company information is required');
        setIsLoading(false);
        return;
      }
  
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/gender-distribution?company=${encodeURIComponent(company)}`);
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        if (data.years) {
          setYears(data.years);
        }
      } catch (err) {
        console.error('Failed to fetch years:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch years');
      } finally {
        setIsLoading(false);
      }
    };
  
    if (company) {
      fetchYears();
    }
  }, [company]);

// Add useEffect to handle URL changes
useEffect(() => {
  const tabFromUrl = searchParams.get('tab');
  if (tabFromUrl === 'input' || tabFromUrl === 'visuals' || tabFromUrl === 'pdfs') {
    setActiveTab(tabFromUrl);
  }
}, [searchParams]);

// Fix the handleTabChange function
const handleTabChange = (tab: 'input' | 'visuals' | 'pdfs') => {
  setActiveTab(tab);
  
  // Update URL while preserving other parameters
  const params = new URLSearchParams(window.location.search);
  params.set('tab', tab);
  // Preserve the view parameter if it exists
  const currentView = searchParams.get('view');
  if (currentView) {
    params.set('view', currentView);
  }
  router.push(`${window.location.pathname}?${params.toString()}`);
};
  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }
  };

  const uploadFile = async (file: File, currentTab: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company', company || 'unknown');
    
    // Get the section from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('view');
    
    // Log for debugging
    console.log('Uploading file with section:', section);
    
    if (!section) {
      throw new Error('Section information is missing');
    }
    
    formData.append('section', section);
  
    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error uploading file');
    }
  
    return await response.json();
  };
  
  // Then modify your handleFileUpload function:
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
  
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      for (const file of Array.from(files)) {
        try {
          validateFile(file);
          await uploadFile(file, activeTab);
          toast({
            title: "Success",
            description: `${file.name} uploaded successfully`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : 'Error uploading file',
            variant: "destructive",
          });
          console.error('Upload error:', error);
        }
      }
      await fetchPDFs();
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const handleViewPdf = (pdf: PDFFile) => {
    setSelectedPdf(pdf);
    setIsViewerOpen(true);
  };

  const handleDeletePdf = (pdf: PDFFile) => {
    setPdfToDelete(pdf);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pdfToDelete) return;

    try {
      const response = await fetch(`/api/delete-pdf?id=${encodeURIComponent(pdfToDelete.id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      await fetchPDFs();
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error deleting file',
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setPdfToDelete(null);
    }
  };

  const PDFViewer = () => {
    const [viewerError, setViewerError] = useState(false);
  
    return (
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedPdf?.name}</span>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() => setIsViewerOpen(false)}
                >
                  <X className="h-4 w-4 text-white" />
                </Button>
              </DialogClose>
            </DialogTitle>
          </DialogHeader>
          {selectedPdf && (
            <div className="w-full h-[70vh] relative bg-gray-100 rounded-lg">
              {!viewerError ? (
                <embed
                  src={selectedPdf.url}
                  type="application/pdf"
                  className="w-full h-full rounded-lg"
                  onError={() => setViewerError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <p className="text-gray-600">Unable to display PDF directly.</p>
                  <Button
                    variant="default"
                    onClick={() => window.open(selectedPdf.url, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const DeleteConfirmDialog = () => (
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete PDF</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{pdfToDelete?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const PDFManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => document.getElementById('pdf-upload')?.click()}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </Button>
        <Button
          onClick={fetchPDFs}
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <input
          type="file"
          id="pdf-upload"
          className="hidden"
          accept=".pdf"
          multiple
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        {isUploading && (
          <div className="flex items-center gap-2">
            <div className="h-1 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Uploaded Documents</h3>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : pdfs.length === 0 ? (
          <p className="text-gray-500">No PDFs uploaded yet</p>
        ) : (
          <div className="grid gap-4">
            {pdfs.map((pdf) => (
              <Card key={pdf.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{pdf.name}</p>
                      <p className="text-sm text-gray-500">
                        Uploaded on {pdf.uploadDate} • {pdf.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewPdf(pdf)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeletePdf(pdf)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <PDFViewer />
      <DeleteConfirmDialog />
    </div>
  );

  if (!company) {
    return (
      <div className="w-full p-4 text-yellow-600">
        Company information is required to view this data.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-50">
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            {Object.entries(tabs).map(([key, tab]) => {
              const Icon = tab.icon;
              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key as typeof activeTab)}
                  className={`
                    group inline-flex items-center py-3 px-4 rounded-md font-medium text-sm transition-colors
                    ${activeTab === key
                      ? `${tab.color} bg-white shadow-md`
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'}
                  `}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'input' && company && (
          <DataInputForm company={company} />
        )}
        {activeTab === 'visuals' && (
          <div className="space-y-6">
            <EducationChart company={company} />
            <GenderDistributionChart years={years} company={company} />
            <EmployeeFluctuationChart company={company} />
            <LeaveTrackingChart company={company} />
          </div>
        )}
        {activeTab === 'pdfs' && (
          <PDFManagement />
        )}
      </div>
    </div>
  );
};

export default SocialTabs;