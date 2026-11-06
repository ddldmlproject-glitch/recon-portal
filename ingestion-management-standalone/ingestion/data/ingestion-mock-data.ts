import { IngestionDocument } from '../models/ingestion-document.model';

const date = (daysAgo: number): string => {
  const value = new Date();
  value.setDate(value.getDate() - daysAgo);
  return value.toISOString();
};

/** API-shaped objects used by the mock repository during local UI development. */
export const INGESTION_MOCK_DATA: IngestionDocument[] = [
  { documentId: 'DOC-1048', fileName: 'Resume_Yogesh_Srivastav.pdf', fileType: 'PDF', fileSize: 482310, uploadedBy: 'Yogesh Srivastav', uploadedAt: date(1), documentCategory: 'Personal Resume', status: 'INGESTED', chunks: 18, description: 'Sample incorrect upload for testing the remove flow.' },
  { documentId: 'DOC-1047', fileName: 'Technical_Specification_v2.pdf', fileType: 'PDF', fileSize: 2841024, uploadedBy: 'Kasturi', uploadedAt: date(1), documentCategory: 'Technical Specification', status: 'INGESTED', chunks: 126, description: 'Functional and technical requirements.' },
  { documentId: 'DOC-1046', fileName: 'Knowledge_Model_Architecture.xlsx', fileType: 'XLSX', fileSize: 628410, uploadedBy: 'Manju', uploadedAt: date(2), documentCategory: 'Architecture', status: 'PROCESSING', chunks: 0, description: 'Architecture inventory and source mapping.' },
  { documentId: 'DOC-1045', fileName: 'Legacy_Design_Notes.pdf', fileType: 'PDF', fileSize: 1204830, uploadedBy: 'Yogesh Srivastav', uploadedAt: date(4), documentCategory: 'Design Document', status: 'FAILED', chunks: 0, description: 'Sample failed record.' },
  { documentId: 'DOC-1044', fileName: 'Release_Notes_Q3.pdf', fileType: 'PDF', fileSize: 640210, uploadedBy: 'Arun Kumar', uploadedAt: date(11), documentCategory: 'Release Notes', status: 'REMOVED', chunks: 0, description: 'Superseded release notes.', removalReason: 'Superseded document', removedAt: date(2) }
];
