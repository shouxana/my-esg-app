export interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File;
  onImport: (mappings: ColumnMapping[], data: any[]) => Promise<void>;
}

export interface ColumnMapping {
  excelColumn: string;
  dbColumn: string;
  dataType: string;
  transform?: (value: any) => any;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  required: boolean;
}

export interface DataTypeOption {
  label: string;
  value: string;
}

export const DATABASE_COLUMNS: DatabaseColumn[] = [
  { name: 'full_name', type: 'text', required: true },
  { name: 'employee_mail', type: 'text', required: true },
  { name: 'birth_date', type: 'date', required: true },
  { name: 'employment_date', type: 'date', required: true },
  { name: 'termination_date', type: 'date', required: false },
  { name: 'position_id', type: 'text', required: true },
  { name: 'education_id', type: 'text', required: true },
  { name: 'marital_status_id', type: 'text', required: true },
  { name: 'gender_id', type: 'text', required: true },
  { name: 'managerial_position_id', type: 'text', required: true }
] as const;

export const DATA_TYPES: DataTypeOption[] = [
  { label: 'Text', value: 'text' },
  { label: 'Date', value: 'date' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Datetime', value: 'datetime' }

] as const;