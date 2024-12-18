'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx-js-style';
import { Upload, Download, Table, Loader2 } from 'lucide-react';
import ColumnMappingModal from '../components/ColumnMappingModal';
import EmployeeUpdateLogModal from './EmployeeUpdateLogModal';
import { ColumnMapping } from '@/types/column-mapping';
import ConfirmationModal from './ConfirmationModal';

interface MetricItem {
  label: string;
  status: 'complete' | 'incomplete';
  percentage: number;
}

interface MetricDetails {
  description: string;
  items: MetricItem[];
}

interface Metric {
  title: string;
  details: MetricDetails;
  percentage: number;
}

interface Metrics {
  requiredFields: Metric;
  dataAccuracy: Metric;
  esgMetrics: Metric;
}

interface RequiredFieldMetrics {
  complete: number;
  total: number;
}

const calculateMetrics = (employees: Employee[], positions: DropdownOption[], educations: DropdownOption[], genders: DropdownOption[]): Metrics => {
  // Required Fields Metrics calculation
  const requiredFieldsMetrics = employees.reduce((acc: Record<string, { complete: number; total: number }>, employee) => {
    const fields = [
      { field: 'full_name', label: 'Full Name' },
      { field: 'employee_mail', label: 'Employee Mail' },
      { field: 'birth_date', label: 'Birth Date' },
      { field: 'employment_date', label: 'Employment Date' },
      { field: 'position_id', label: 'Position' },
      { field: 'education_id', label: 'Education' },
      { field: 'gender_id', label: 'Gender' }
    ];

    fields.forEach(({ field, label }) => {
      if (!acc[label]) {
        acc[label] = { complete: 0, total: 0 };
      }
      acc[label].total++;
      if (employee[field as keyof Employee]) {
        acc[label].complete++;
      }
    });

    return acc;
  }, {});

  // Convert to MetricItem array
  const requiredFieldItems: MetricItem[] = Object.entries(requiredFieldsMetrics).map(([label, data]) => ({
    label,
    status: data.complete === data.total ? 'complete' : 'incomplete',
    percentage: Math.round((data.complete / data.total) * 100)
  }));

  // Data Accuracy Metrics
  const dataAccuracyItems: MetricItem[] = [
    {
      label: 'Email Format',
      status: employees.every(emp =>
        emp.employee_mail?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) ? 'complete' : 'incomplete',
      percentage: employees.length > 0 ? Math.round((employees.filter(emp =>
        emp.employee_mail?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)).length / employees.length) * 100) : 0
    },
    {
      label: 'Date Validations',
      status: employees.every(emp => {
        const birthDate = new Date(emp.birth_date);
        const employmentDate = new Date(emp.employment_date);
        return birthDate < employmentDate && birthDate.getFullYear() > 1900;
      }) ? 'complete' : 'incomplete',
      percentage: employees.length > 0 ? Math.round((employees.filter(emp => {
        const birthDate = new Date(emp.birth_date);
        const employmentDate = new Date(emp.employment_date);
        return birthDate < employmentDate && birthDate.getFullYear() > 1900;
      }).length / employees.length) * 100) : 0
    },
    {
      label: 'ID References',
      status: employees.every(emp =>
        positions.some(pos => pos.id === emp.position_id) &&
        educations.some(edu => edu.id === emp.education_id) &&
        genders.some(gen => gen.id === emp.gender_id)) ? 'complete' : 'incomplete',
      percentage: employees.length > 0 ? Math.round((employees.filter(emp =>
        positions.some(pos => pos.id === emp.position_id) &&
        educations.some(edu => edu.id === emp.education_id) &&
        genders.some(gen => gen.id === emp.gender_id)).length / employees.length) * 100) : 0
    }
  ];

  // ESG Metrics
  const esgMetricItems: MetricItem[] = [
    {
      label: 'Gender Distribution',
      status: employees.length > 0 && genders.length > 0 ? 'complete' : 'incomplete',
      percentage: employees.length > 0 && genders.length > 0 ? 100 : 0
    },
    {
      label: 'Age Demographics',
      status: employees.every(emp => emp.birth_date) ? 'complete' : 'incomplete',
      percentage: employees.length > 0 ? Math.round((employees.filter(emp => emp.birth_date).length / employees.length) * 100) : 0
    },
    {
      label: 'Employment Type',
      status: employees.every(emp => emp.position_id) ? 'complete' : 'incomplete',
      percentage: employees.length > 0 ? Math.round((employees.filter(emp => emp.position_id).length / employees.length) * 100) : 0
    }
  ];

  return {
    requiredFields: {
      title: 'Required Fields Details',
      details: {
        description: 'Breakdown of mandatory fields completion status:',
        items: requiredFieldItems
      },
      percentage: Math.round(
        (requiredFieldItems.reduce((sum, item) => sum + (item.status === 'complete' ? 1 : 0), 0) /
        requiredFieldItems.length) * 100
      )
    },
    dataAccuracy: {
      title: 'Data Accuracy Analysis',
      details: {
        description: 'Current data validation status:',
        items: dataAccuracyItems
      },
      percentage: Math.round(
        (dataAccuracyItems.reduce((sum, item) => sum + (item.status === 'complete' ? 1 : 0), 0) /
        dataAccuracyItems.length) * 100
      )
    },
    esgMetrics: {
      title: 'ESG Metrics Coverage',
      details: {
        description: 'ESG reporting requirements completion:',
        items: esgMetricItems
      },
      percentage: Math.round(
        (esgMetricItems.reduce((sum, item) => sum + (item.status === 'complete' ? 1 : 0), 0) /
        esgMetricItems.length) * 100
      )
    }
  };
};


interface DataInputFormProps {
  company: string;
}

type InputField = {
  label: string;
  type: 'text' | 'date' | 'select';
  options?: { value: string; label: string; }[];
}

type ModalType = 'EMAIL_EXISTS' | 'DUPLICATE_PERSON' | 'SUCCESS' | 'ERROR';

interface ModalData {
  type: ModalType;
  title: string;
  existingEmployee?: {
    full_name: string;
    employee_mail?: string;
  };
  suggestions?: string[];
  message?: string;
}

type DropdownOption = {
  id: string;
  name: string;
};

type Employee = {
  employee_id: string;
  full_name: string;
  employee_mail: string;
  birth_date: string;
  employment_date: string;
  termination_date: string | null;
  position_id: string;
  education_id: string;
  marital_status_id: string;
  gender_id: string;
  managerial_position_id: string;
  company: string;
  leave_date_start: string;
  leave_date_end: string;
};

// Format date helper function
const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '';
    }
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return '';
  }
};

const DataInputForm: React.FC<DataInputFormProps> = ({ company }) => {
  // Field definitions
  const inputFields: InputField[] = [
    { label: 'Full Name', type: 'text' },
    { label: 'Employee Mail', type: 'text' },
    { label: 'Birth Date', type: 'date' },
    { label: 'Employment Date', type: 'date' },
    { label: 'Termination Date', type: 'date' },
    { label: 'Leave Date Start', type: 'date' },
    { label: 'Leave Start End', type: 'date' },
  ];

  const updateInputFields: InputField[] = [
    { label: 'Full Name', type: 'text' },
    { label: 'Employee Mail', type: 'text' },
    { label: 'Birth Date', type: 'date' },
    { label: 'Employment Date', type: 'date' },
    { label: 'Termination Date', type: 'date' },
    { label: 'Leave Date Start', type: 'date' },
    { label: 'Leave Date End', type: 'date' },
  ];

  const dropdownFields: InputField[] = [
    {
      label: 'Position ID',
      type: 'select',
      options: [{ value: '', label: 'Select Position' }]
    },
    {
      label: 'Education ID',
      type: 'select',
      options: [{ value: '', label: 'Select Education' }]
    },
    {
      label: 'Marital Status ID',
      type: 'select',
      options: [{ value: '', label: 'Select Marital Status' }]
    },
    {
      label: 'Gender ID',
      type: 'select',
      options: [{ value: '', label: 'Select Gender' }]
    },
    {
      label: 'Managerial Position ID',
      type: 'select',
      options: [
        { value: '', label: 'Select Option' },
        { value: '1', label: 'Yes' },
        { value: '2', label: 'No' },
      ]
    },
  ];


  // State definitions
  const [positions, setPositions] = useState<DropdownOption[]>([]);
  const [educations, setEducations] = useState<DropdownOption[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<DropdownOption[]>([]);
  const [genders, setGenders] = useState<DropdownOption[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isColumnMappingOpen, setIsColumnMappingOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isChangeLogOpen, setIsChangeLogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const updateSectionRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [isProcessingModal, setIsProcessingModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  
  // Form data states
  const [formData, setFormData] = useState({
    full_name: '',
    employee_mail: '',
    birth_date: '',
    employment_date: '',
    termination_date: '',
    leave_date_start: '',
    leave_date_end:'',
    position_id: '',
    education_id: '',
    marital_status_id: '',
    gender_id: '',
    managerial_position_id: '',
    company: company
  });

  const [updateFormData, setUpdateFormData] = useState({
    full_name: '',
    employee_mail: '',
    birth_date: '',
    employment_date: '',
    termination_date: '',
    leave_date_start: '',
    leave_date_end:'',
    position_id: '',
    education_id: '',
    marital_status_id: '',
    gender_id: '',
    managerial_position_id: '',
    company: company
  });

  // Effect Hooks
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!company) {
        console.error('Company is required');
        return;
      }

      setIsLoading(true);
      try {
        const [
          positionsRes,
          educationsRes,
          maritalStatusesRes,
          gendersRes,
          employeesRes
        ] = await Promise.all([
          fetch('/api/positions'),
          fetch('/api/educations'),
          fetch('/api/marital-statuses'),
          fetch('/api/genders'),
          fetch(`/api/employees?company=${encodeURIComponent(company)}`)
        ]);

        // Check responses
        if (!positionsRes.ok) throw new Error('Failed to fetch positions');
        if (!educationsRes.ok) throw new Error('Failed to fetch educations');
        if (!maritalStatusesRes.ok) throw new Error('Failed to fetch marital statuses');
        if (!gendersRes.ok) throw new Error('Failed to fetch genders');
        if (!employeesRes.ok) throw new Error('Failed to fetch employees');

        const [
          positionsData,
          educationsData,
          maritalStatusesData,
          gendersData,
          employeesData
        ] = await Promise.all([
          positionsRes.json(),
          educationsRes.json(),
          maritalStatusesRes.json(),
          gendersRes.json(),
          employeesRes.json()
        ]);

        setPositions(positionsData);
        setEducations(educationsData);
        setMaritalStatuses(maritalStatusesData);
        setGenders(gendersData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        alert('Failed to fetch form data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownData();
  }, [company]);

  // Scroll handling effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      window.scrollTo(0, scrollPosition);
    }
  }, [selectedEmployee, scrollPosition]);

  // Event Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSuggestionSelect = (suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      employee_mail: suggestion
    }));
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalData(null);
    setIsProcessingModal(false);
  };

  const refreshEmployees = async () => {
    try {
      const response = await fetch(`/api/employees?company=${encodeURIComponent(company)}`);
      if (response.ok) {
        const updatedEmployees = await response.json();
        setEmployees(updatedEmployees);
      }
    } catch (error) {
      console.error('Error refreshing employees:', error);
    }
  };

  const handleEmployeeSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const employeeId = e.target.value;
    
    if (!employeeId) {
      setSelectedEmployee('');
      setUpdateFormData({
        full_name: '',
        employee_mail: '',
        birth_date: '',
        employment_date: '',
        termination_date: '',
        leave_date_start: '',
        leave_date_end: '',
        position_id: '',
        education_id: '',
        marital_status_id: '',
        gender_id: '',
        managerial_position_id: '',
        company: company
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/employees?id=${employeeId}&company=${encodeURIComponent(company)}`);
      
      if (!response.ok) throw new Error('Failed to fetch employee details');
      
      const employee = await response.json();
      
      if (employee) {
        setSelectedEmployee(employeeId);
        setUpdateFormData({
          full_name: employee.full_name || '',
          employee_mail: employee.employee_mail || '',
          birth_date: formatDate(employee.birth_date),
          employment_date: formatDate(employee.employment_date),
          termination_date: formatDate(employee.termination_date),
          position_id: employee.position_id || '',
          education_id: employee.education_id || '',
          marital_status_id: employee.marital_status_id || '',
          gender_id: employee.gender_id || '',
          managerial_position_id: employee.managerial_position_id || '',
          company: employee.company || company,
          leave_date_start: formatDate(employee.leave_date_start),
          leave_date_end: formatDate(employee.leave_date_end)
        });
      }
    } catch (error) {
      console.error('Error fetching employee details:', error);
      alert('Failed to fetch employee details');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to calculate metrics based on actual data
  const calculateMetrics = (employees: Employee[], positions: DropdownOption[], educations: DropdownOption[], genders: DropdownOption[]): Metrics => {
    // Required Fields Metrics
    const requiredFieldsMetrics = employees.reduce((acc: Record<string, RequiredFieldMetrics>, employee) => {
      const fields = [
        { field: 'full_name', label: 'Full Name' },
        { field: 'employee_mail', label: 'Employee Mail' },
        { field: 'birth_date', label: 'Birth Date' },
        { field: 'employment_date', label: 'Employment Date' },
        { field: 'position_id', label: 'Position' },
        { field: 'education_id', label: 'Education' },
        { field: 'gender_id', label: 'Gender' }
      ];

      fields.forEach(({ field, label }) => {
        if (!acc[label]) {
          acc[label] = { complete: 0, total: 0 };
        }
        acc[label].total++;
        if (employee[field as keyof Employee]) {
          acc[label].complete++;
        }
      });
  
      return acc;
    }, {} as Record<string, RequiredFieldMetrics>); // Add type assertion here as well

  // Data Accuracy Metrics
  const dataAccuracyMetrics = {
    'Email Format': {
      status: employees.every(emp => 
        emp.employee_mail?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ),
      total: employees.length
    },
    'Date Validations': {
      status: employees.every(emp => {
        const birthDate = new Date(emp.birth_date);
        const employmentDate = new Date(emp.employment_date);
        return birthDate < employmentDate && birthDate.getFullYear() > 1900;
      }),
      total: employees.length
    },
    'ID References': {
      status: employees.every(emp => 
        positions.some(pos => pos.id === emp.position_id) &&
        educations.some(edu => edu.id === emp.education_id) &&
        genders.some(gen => gen.id === emp.gender_id)
      ),
      total: employees.length
    },
    'Data Consistency': {
      status: employees.every(emp => {
        // Add your data consistency checks here
        // For example, check if termination date is after employment date
        if (emp.termination_date) {
          return new Date(emp.termination_date) > new Date(emp.employment_date);
        }
        return true;
      }),
      total: employees.length
    }
  };

  // ESG Metrics
  const esgMetrics = {
    'Gender Distribution': {
      status: employees.length > 0 && genders.length > 0,
      total: 1
    },
    'Age Demographics': {
      status: employees.every(emp => emp.birth_date),
      total: employees.length
    },
    'Diversity Metrics': {
      status: true, // Based on your diversity tracking logic
      total: 1
    },
    'Employment Type': {
      status: employees.every(emp => emp.position_id),
      total: employees.length
    },
    'Training Data': {
      // Add your training data tracking logic
      status: false,
      total: 1
    }
  };

  return {
    requiredFields: {
      title: 'Required Fields Details',
      details: {
        description: 'Breakdown of mandatory fields completion status:',
        items: Object.entries(requiredFieldsMetrics).map(([label, data]) => ({
          label,
          status: data.complete === data.total ? 'complete' : 'incomplete',
          percentage: Math.round((data.complete / data.total) * 100)
        }))
      },
      percentage: Math.round(
        (Object.values(requiredFieldsMetrics)
          .reduce((sum, data) => sum + data.complete, 0) /
          Object.values(requiredFieldsMetrics)
            .reduce((sum, data) => sum + data.total, 0)) * 100
      )
    },
    dataAccuracy: {
      title: 'Data Accuracy Analysis',
      details: {
        description: 'Current data validation status:',
        items: Object.entries(dataAccuracyMetrics).map(([label, data]) => ({
          label,
          status: data.status ? 'complete' : 'incomplete',
          percentage: Math.round((data.status ? data.total : 0) / data.total * 100)
        }))
      },
      percentage: Math.round(
        (Object.values(dataAccuracyMetrics)
          .filter(data => data.status).length /
          Object.keys(dataAccuracyMetrics).length) * 100
      )
    },
    esgMetrics: {
      title: 'ESG Metrics Coverage',
      details: {
        description: 'ESG reporting requirements completion:',
        items: Object.entries(esgMetrics).map(([label, data]) => ({
          label,
          status: data.status ? 'complete' : 'incomplete',
          percentage: Math.round((data.status ? data.total : 0) / data.total * 100)
        }))
      },
      percentage: Math.round(
        (Object.values(esgMetrics)
          .filter(data => data.status).length /
          Object.keys(esgMetrics).length) * 100
      )
    }
  };
};

// Use the metrics in your component
const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null);
const [metrics, setMetrics] = useState<Metrics>(() => 
  calculateMetrics(employees, positions, educations, genders)
);

// Update metrics when data changes
useEffect(() => {
  setMetrics(calculateMetrics(employees, positions, educations, genders));
}, [employees, positions, educations, genders]);

  const metricsDetails = {
    requiredFields: {
      title: 'Required Fields Details',
      details: {
        description: 'Breakdown of mandatory fields completion status:',
        items: [
          { label: 'Full Name', status: 'complete' },
          { label: 'Employee Mail', status: 'complete' },
          { label: 'Birth Date', status: 'complete' },
          { label: 'Employment Date', status: 'complete' },
          { label: 'Position', status: 'complete' },
          { label: 'Education', status: 'complete' },
          { label: 'Gender', status: 'complete' }
        ]
      }
    },
    dataAccuracy: {
      title: 'Data Accuracy Analysis',
      details: {
        description: 'Current data validation status:',
        items: [
          { label: 'Email Format', status: 'complete' },
          { label: 'Date Validations', status: 'complete' },
          { label: 'ID References', status: 'complete' },
          { label: 'Data Consistency', status: 'incomplete' }
        ]
      }
    },
    esgMetrics: {
      title: 'ESG Metrics Coverage',
      details: {
        description: 'ESG reporting requirements completion:',
        items: [
          { label: 'Gender Distribution', status: 'complete' },
          { label: 'Age Demographics', status: 'complete' },
          { label: 'Diversity Metrics', status: 'complete' },
          { label: 'Employment Type', status: 'incomplete' },
          { label: 'Training Data', status: 'incomplete' }
        ]
      }
    }
  };

  const handleDuplicateConfirm = async () => {
    setIsProcessingModal(true);
    try {
      const forceResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, force: true })
      });
  
      if (!forceResponse.ok) {
        throw new Error('Failed to create employee');
      }
  
      await refreshEmployees();
      setModalData({
        type: 'SUCCESS',
        title: 'Success',
        message: 'Employee added successfully!'
      });
  
      // Reset form
      setFormData({
        full_name: '',
        employee_mail: '',
        birth_date: '',
        employment_date: '',
        termination_date: '',
        leave_date_start: '',
        leave_date_end:'',
        position_id: '',
        education_id: '',
        marital_status_id: '',
        gender_id: '',
        managerial_position_id: '',
        company
      });
    } catch (error) {
      setModalData({
        type: 'ERROR',
        title: 'Error',
        message: `Failed to add employee: ${(error as Error).message}`
      });
    } finally {
      setIsProcessingModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedData = {
        ...formData,
        company,
        birth_date: formData.birth_date,
        employment_date: formData.employment_date || null,
        termination_date: formData.termination_date || null,
        leave_date_start: formData.leave_date_start || null,
        leave_date_end: formData.leave_date_end || null,
      };

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData)
      });

      const result = await response.json();

      if (response.status === 409) {
        if (result.type === 'EMAIL_EXISTS') {
          setModalData({
            type: 'EMAIL_EXISTS',
            title: 'Email Already Registered',
            existingEmployee: {
              full_name: result.existingEmployee.full_name,
              employee_mail: result.existingEmployee.employee_mail
            },
            suggestions: result.suggestions
          });
          setIsModalOpen(true);
          return;
        }

        if (result.type === 'DUPLICATE_PERSON') {
          setModalData({
            type: 'DUPLICATE_PERSON',
            title: 'Duplicate Employee Found',
            existingEmployee: {
              full_name: result.existingEmployee.full_name,
              employee_mail: result.existingEmployee.employee_mail
            }
          });
          setIsModalOpen(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to create employee');
      }

      setModalData({
        type: 'SUCCESS',
        title: 'Success',
        message: 'Employee added successfully!'
      });
      setIsModalOpen(true);

      await refreshEmployees();
      
      // Reset form
      setFormData({
        full_name: '',
        employee_mail: '',
        birth_date: '',
        employment_date: '',
        termination_date: '',
        leave_date_start: '',
        leave_date_end:'',
        position_id: '',
        education_id: '',
        marital_status_id: '',
        gender_id: '',
        managerial_position_id: '',
        company
      });
    } catch (error) {
      setModalData({
        type: 'ERROR',
        title: 'Error',
        message: `Failed to add employee: ${(error as Error).message}`
      });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setModalData({
        type: 'ERROR',
        title: 'Error',
        message: 'Please select an employee'
      });
      setIsModalOpen(true);
      return;
    }
  
    setIsLoading(true);
    try {
      if (!updateFormData.birth_date) {
        throw new Error('Birth date is required');
      }
  
      const formattedData = {
        ...updateFormData,
        company,
        birth_date: updateFormData.birth_date,
        employment_date: updateFormData.employment_date || null,
        termination_date: updateFormData.termination_date || null,
        leave_date_start: updateFormData.leave_date_start || null,
        leave_date_end: updateFormData.leave_date_end || null,
      };
  
      const response = await fetch(`/api/employees/${selectedEmployee}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        cache: 'no-store',
        body: JSON.stringify(formattedData)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update employee');
      }
  
      await refreshEmployees();
      setModalData({
        type: 'SUCCESS',
        title: 'Success',
        message: 'Employee updated successfully!'
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error updating employee:', error);
      setModalData({
        type: 'ERROR',
        title: 'Error',
        message: `Failed to update employee: ${(error as Error).message}`
      });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsColumnMappingOpen(true);
    }
  };

  const handleMappedDataImport = async (mappings: ColumnMapping[], data: any[]) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('company', company);

      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import data');
      }

      const result = await response.json();
      setModalData({
        type: 'SUCCESS',
        title: 'Success',
        message: `Successfully imported ${result.count} employees`
      });
      setIsModalOpen(true);
      await refreshEmployees();
    } catch (error) {
      console.error('Error importing data:', error);
      setModalData({
        type: 'ERROR',
        title: 'Error',
        message: `Failed to import data: ${(error as Error).message}`
      });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
      setIsColumnMappingOpen(false);
      setSelectedFile(null);
    }
  };

  const downloadExcelTemplate = async () => {
    // Ensure you have the latest dropdown data
    if (positions.length === 0 || educations.length === 0 || genders.length === 0 || maritalStatuses.length === 0) {
      // Fetch the data if not already available
      try {
        setIsLoading(true);
        const [
          positionsRes,
          educationsRes,
          maritalStatusesRes,
          gendersRes
        ] = await Promise.all([
          fetch('/api/positions'),
          fetch('/api/educations'),
          fetch('/api/marital-statuses'),
          fetch('/api/genders')
        ]);
  
        if (!positionsRes.ok) throw new Error('Failed to fetch positions');
        if (!educationsRes.ok) throw new Error('Failed to fetch educations');
        if (!maritalStatusesRes.ok) throw new Error('Failed to fetch marital statuses');
        if (!gendersRes.ok) throw new Error('Failed to fetch genders');
  
        const [
          positionsData,
          educationsData,
          maritalStatusesData,
          gendersData
        ] = await Promise.all([
          positionsRes.json(),
          educationsRes.json(),
          maritalStatusesRes.json(),
          gendersRes.json()
        ]);
  
        setPositions(positionsData);
        setEducations(educationsData);
        setMaritalStatuses(maritalStatusesData);
        setGenders(gendersData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        alert('Failed to fetch data for the template. Please try again.');
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }
  
    // Define the headers
    const headers = [
      'full_name',
      'employee_mail',
      'birth_date',
      'employment_date',
      'termination_date',
      'position_id',
      'education_id',
      'marital_status_id',
      'gender_id',
      'managerial_position_id'
    ];
  
    // Create the worksheet data with instructions and headers
    const ws_data = [
      ['For fields like Position ID, Education ID, Gender ID, Marital Status ID, and Managerial Position ID, refer to the corresponding sheets for valid IDs. Please DELETE THIS ROW before importing!'],
      headers
      // You can add an empty row here if you want users to start entering data from row 3
    ];
  
    // Create the worksheet from the data
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
  
    // Create a new workbook and append the sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
    // Add sheets with valid IDs and descriptions
    const positionsSheet = XLSX.utils.json_to_sheet(
      positions.map(pos => ({ ID: pos.id, Name: pos.name }))
    );
    XLSX.utils.book_append_sheet(wb, positionsSheet, 'Positions');
  
    const educationsSheet = XLSX.utils.json_to_sheet(
      educations.map(edu => ({ ID: edu.id, Name: edu.name }))
    );
    XLSX.utils.book_append_sheet(wb, educationsSheet, 'Educations');
  
    const gendersSheet = XLSX.utils.json_to_sheet(
      genders.map(gen => ({ ID: gen.id, Name: gen.name }))
    );
    XLSX.utils.book_append_sheet(wb, gendersSheet, 'Genders');
  
    const maritalStatusesSheet = XLSX.utils.json_to_sheet(
      maritalStatuses.map(ms => ({ ID: ms.id, Name: ms.name }))
    );
    XLSX.utils.book_append_sheet(wb, maritalStatusesSheet, 'Marital Statuses');
  
    // Managerial Positions
    const managerialPositionsSheet = XLSX.utils.json_to_sheet([
      { ID: '1', Name: 'Yes' },
      { ID: '2', Name: 'No' },
    ]);
    XLSX.utils.book_append_sheet(wb, managerialPositionsSheet, 'Managerial Positions');
  
    // Write the file
    XLSX.writeFile(wb, `employee_template_${company}.xlsx`);
  };
  

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-blue-300">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Social Data Management</h1>
          
        </div>
        <p className="text-sm text-gray-600">
          Tracking employee data for {company.toUpperCase()} in alignment with ESG reporting standards
        </p>
      </div>

    
      {/* Data Quality Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        onClick={() => {
          setSelectedMetric(metrics.requiredFields);
          setDetailsModalOpen(true);
        }}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="text-sm font-medium text-gray-600">Required Fields</div>
        <div className="text-2xl font-bold text-green-600">{metrics.requiredFields.percentage}%</div>
        <div className="text-xs text-gray-500">All mandatory fields complete</div>
      </button>

  <button
    onClick={() => {
      setSelectedMetric(metrics.dataAccuracy);
      setDetailsModalOpen(true);
    }}
    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-left"
  >
    <div className="text-sm font-medium text-gray-600">Data Accuracy</div>
    <div className="text-2xl font-bold text-blue-600">{metrics.dataAccuracy.percentage}%</div>
    <div className="text-xs text-gray-500">Based on validation rules</div>
  </button>

  <button
    onClick={() => {
      setSelectedMetric(metrics.esgMetrics);
      setDetailsModalOpen(true);
    }}
    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-left"
  >
    <div className="text-sm font-medium text-gray-600">ESG Metrics Coverage</div>
    <div className="text-2xl font-bold text-purple-600">{metrics.esgMetrics.percentage}%</div>
    <div className="text-xs text-gray-500">Of required ESG data points</div>
  </button>

  {/* Details Modal */}
  {detailsModalOpen && selectedMetric && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
      <h3 className="text-lg font-semibold mb-4">{selectedMetric.title}</h3>
      <p className="text-gray-600 mb-4">{selectedMetric.details.description}</p>
      <div className="space-y-2">
        {selectedMetric.details.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-gray-700">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-sm ${
                item.status === 'complete' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.status}
              </span>
              <span className="text-gray-600 text-sm">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setDetailsModalOpen(false)}
        className="mt-6 w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
      >
        Close
      </button>
    </div>
  </div>
)}
</div>

{/* Main Form Grid Container */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Employee Section */}
<div className="bg-white rounded-lg shadow-lg border border-blue-100 min-h-[700px]">
  <div className="bg-blue-100 p-4 rounded-t-lg border-b border-blue-100">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Add New Employee</h2>
        <p className="text-sm text-gray-600">Enter details for new employee records</p>
      </div>
      <div className="flex gap-2">
        <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray rounded-md hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors">
          <Upload className="h-4 w-4" />
          <span>Import</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={downloadExcelTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>
    </div>
  </div>
  <div className="p-6 flex flex-col min-h-[800px]">
  <form onSubmit={handleSubmit} className="flex flex-col flex-1">
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {/* Left Column */}
      <div className="space-y-4 w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee Mail
          </label>
          <input
            type="email"
            name="employee_mail"
            value={formData.employee_mail}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date
          </label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employment Date
          </label>
          <input
            type="date"
            name="employment_date"
            value={formData.employment_date}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Termination Date
          </label>
          <input
            type="date"
            name="termination_date"
            value={formData.termination_date}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Date Start
          </label>
          <input
            type="date"
            name="leave_date_start"
            value={formData.leave_date_start}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leave Date End
          </label>
          <input
            type="date"
            name="leave_date_end"
            value={formData.leave_date_end}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
          />
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4 w-full">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position ID
          </label>
          <select
            name="position_id"
            value={formData.position_id}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          >
            <option value="">Select Position ID</option>
            {positions.map(pos => (
              <option key={pos.id} value={pos.id}>{pos.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Education ID
          </label>
          <select
            name="education_id"
            value={formData.education_id}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          >
            <option value="">Select Education ID</option>
            {educations.map(edu => (
              <option key={edu.id} value={edu.id}>{edu.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marital Status ID
          </label>
          <select
            name="marital_status_id"
            value={formData.marital_status_id}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          >
            <option value="">Select Marital Status</option>
            {maritalStatuses.map(status => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender ID
          </label>
          <select
            name="gender_id"
            value={formData.gender_id}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          >
            <option value="">Select Gender</option>
            {genders.map(gender => (
              <option key={gender.id} value={gender.id}>{gender.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Managerial Position ID
          </label>
          <select
            name="managerial_position_id"
            value={formData.managerial_position_id}
            onChange={handleInputChange}
            className="w-full h-10 p-2 border rounded-md"
            required
          >
            <option value="">Select Managerial Position</option>
            <option value="1">Yes</option>
            <option value="2">No</option>
          </select>
        </div>
      </div>
    </div>
              <div className="mt-auto pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding Employee...</span>
                    </div>
                    : 'Add Employee'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

       {/* Update Employee Section */}
<div className="bg-white rounded-lg shadow-lg border border-blue-100 min-h-[800px]">
  <div className="bg-blue-50 p-4 rounded-t-lg border-b border-blue-100">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Update Employee</h2>
        <p className="text-sm text-gray-600">Modify existing employee information</p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (!selectedEmployee) {
            setModalData({
              type: 'ERROR',
              title: 'No Employee Selected',
              message: 'Please select an employee to view the change log.'
            });
            setIsModalOpen(true);
          } else {
            setIsChangeLogOpen(true);
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
      >
        <Table className="h-4 w-4" />
        View Change Log
      </button>
    </div>
  </div>
  <div className="p-6 flex flex-col min-h-[800px]">
    <form onSubmit={handleUpdateSubmit} className="flex flex-col flex-1">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Employee
        </label>
        <select
          value={selectedEmployee}
          onChange={handleEmployeeSelect}
          disabled={isLoading}
          className="w-full h-10 p-2 border rounded-md mb-4"
        >
          <option value="">Select an employee</option>
          {employees
            .filter(employee => employee.company === company)
            .map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.full_name} (ID: {employee.employee_id})
              </option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={updateFormData.full_name}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee Mail
            </label>
            <input
              type="email"
              name="employee_mail"
              value={updateFormData.employee_mail}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Date
            </label>
            <input
              type="date"
              name="birth_date"
              value={updateFormData.birth_date}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Date
            </label>
            <input
              type="date"
              name="employment_date"
              value={updateFormData.employment_date}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termination Date
            </label>
            <input
              type="date"
              name="termination_date"
              value={updateFormData.termination_date}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Date Start
            </label>
            <input
              type="date"
              name="leave_date_start"
              value={updateFormData.leave_date_start}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Date End
            </label>
            <input
              type="date"
              name="leave_date_end"
              value={updateFormData.leave_date_end}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position ID
            </label>
            <select
              name="position_id"
              value={updateFormData.position_id}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            >
              <option value="">Select Position ID</option>
              {positions.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Education ID
            </label>
            <select
              name="education_id"
              value={updateFormData.education_id}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            >
              <option value="">Select Education ID</option>
              {educations.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status ID
            </label>
            <select
              name="marital_status_id"
              value={updateFormData.marital_status_id}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            >
              <option value="">Select Marital Status</option>
              {maritalStatuses.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender ID
            </label>
            <select
              name="gender_id"
              value={updateFormData.gender_id}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            >
              <option value="">Select Gender</option>
              {genders.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Managerial Position ID
            </label>
            <select
              name="managerial_position_id"
              value={updateFormData.managerial_position_id}
              onChange={handleUpdateInputChange}
              disabled={!selectedEmployee}
              className="w-full h-10 p-2 border rounded-md"
              required
            >
              <option value="">Select Managerial Position</option>
              <option value="1">Yes</option>
              <option value="2">No</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
      <button
        type="submit"
        disabled={!selectedEmployee || isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
          : 'Save Changes'
        }
      </button>
    </div>
  </form>
</div>
</div>
</div>
       {/* Modals */}
    {isColumnMappingOpen && selectedFile && (
      <ColumnMappingModal
        isOpen={isColumnMappingOpen}
        onClose={() => {
          setIsColumnMappingOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onImport={handleMappedDataImport}
      />
    )}

    {isChangeLogOpen && (
      <EmployeeUpdateLogModal
        isOpen={isChangeLogOpen}
        onClose={() => setIsChangeLogOpen(false)}
        employeeId={selectedEmployee}
        employeeName={updateFormData.full_name}
        company={company}
      />
    )}

    {modalData && (
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={modalData.type === 'DUPLICATE_PERSON' ? handleDuplicateConfirm : undefined}
        onSelectSuggestion={handleEmailSuggestionSelect}
        data={modalData}
        company={company}
      />
    )}
    </div>
  );
};


export default DataInputForm;