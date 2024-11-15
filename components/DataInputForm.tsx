  'use client';

  import React, { useState, useEffect, useRef, useCallback } from 'react';
  import * as XLSX from 'xlsx-js-style';
  import { Upload } from 'lucide-react';
  import ColumnMappingModal from '../components/ColumnMappingModal';
  import EmployeeUpdateLogModal from './EmployeeUpdateLogModal';
  import { ColumnMapping } from '@/types/column-mapping';
  import ConfirmationModal from './ConfirmationModal';




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

    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
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

  // Fetch data effect
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

        const positionsData = await positionsRes.json();
        const educationsData = await educationsRes.json();
        const maritalStatusesData = await maritalStatusesRes.json();
        const gendersData = await gendersRes.json();
        const employeesData = await employeesRes.json();

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

  useEffect(() => {
    if (selectedEmployee) {
      const currentScroll = window.scrollY;
      requestAnimationFrame(() => {
        window.scrollTo({
          top: currentScroll,
          behavior: 'instant'
        });
      });
    }
  }, [selectedEmployee]);

  const [scrollPosition, setScrollPosition] = useState(0);

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

  // Handlers
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedData = {
        ...formData,
        company,
        birth_date: formData.birth_date ,
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

      // Success case
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
      // Check required fields
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
      // Transform the data
      const transformedData = data.map(row => {
        const transformedRow: any = {};
        
        mappings.forEach(mapping => {
          if (mapping.excelColumn && row[mapping.excelColumn] !== undefined) {
            let value = row[mapping.excelColumn];
            
            // Handle special case for managerial position
            if (mapping.dbColumn === 'managerial_position_id') {
              value = value?.toString().toLowerCase() === 'yes' ? '1' : '2';
            }
            // Handle null/undefined values
            else if (value === null || value === undefined || value === '') {
              value = null;
            }
            // Don't transform dates here - send raw values to the API
            transformedRow[mapping.dbColumn] = value;
          }
        });
        
        return transformedRow;
      });

      // Create a new FormData instance
      const formData = new FormData();
      // Append the file itself
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      // Add company to the formData
      formData.append('company', company); // This is from your props

      // Send the file to the API
      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import data');
      }

      const result = await response.json();
      alert(`Successfully imported ${result.count} employees`);
      await refreshEmployees();
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      setIsColumnMappingOpen(false);
      setSelectedFile(null);
    }
  };

    const downloadExcelTemplate = () => {
      // Create the template data
      const template = [
        {
          'full_name': '',
          'employee_mail': '',
          'birth_date': '',
          'employment_date': '',
          'termination_date': '',
          'position_id': '',
          'education_id': '',
          'marital_status_id': '',
          'gender_id': '',
          'managerial_position_id': '',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, `employee_template_${company}.xlsx`);
    };

    if (isLoading) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Insert Employee Data Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Insert Employee Data</h2>
          <form onSubmit={handleSubmit}>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Input Fields */}
                <div className="space-y-4">
                  {inputFields.map((field) => (
                    <div key={field.label}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.label.toLowerCase().replace(/\s+/g, '_')}
                        value={formData[field.label.toLowerCase().replace(/\s+/g, '_') as keyof typeof formData] || ''}
                        onChange={handleInputChange}
                        required={field.label !== 'Termination Date' && 
                          field.label !== 'Leave Date Start' && 
                          field.label !== 'Leave Start End'}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Right Column - Dropdowns */}
                <div className="space-y-4">
                  {dropdownFields.map((field) => (
                    <div key={field.label}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <select
                        name={field.label.toLowerCase().replace(/\s+/g, '_')}
                        value={formData[field.label.toLowerCase().replace(/\s+/g, '_') as keyof typeof formData] || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{`Select ${field.label}`}</option>
                        {field.label === 'Position ID' && positions.map((item) => (
                          <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                        ))}
                        {field.label === 'Education ID' && educations.map((item) => (
                          <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                        ))}
                        {field.label === 'Marital Status ID' && maritalStatuses.map((item) => (
                          <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                        ))}
                        {field.label === 'Gender ID' && genders.map((item) => (
                          <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                        ))}
                        {field.label === 'Managerial Position ID' && [
                          { id: '1', name: 'Yes' },
                          { id: '2', name: 'No' }
                        ].map((item) => (
                          <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <div className="flex space-x-4">
                  <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelImport}
                      className="hidden"
                    />
                    Import Excel File
                  </label>
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Download Template
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Submit Data'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Update Employee Data Section */}
        <div ref={updateSectionRef} className="bg-white p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Update Employee Data</h2>
    <form 
      onSubmit={handleUpdateSubmit} 
      className="bg-yellow-50 rounded-lg p-6"
    >
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Employee
        </label>
        <div className="relative">
          <select
            value={selectedEmployee}
            onChange={(e) => {
              e.preventDefault();
              const scrollPos = window.scrollY;
              const selectedId = e.target.value;
              setSelectedEmployee(selectedId);
              if (selectedId) {
                fetch(`/api/employees?id=${selectedId}&company=${encodeURIComponent(company)}`)
                  .then(response => response.json())
                  .then(employee => {
                    setUpdateFormData({
                      full_name: employee.full_name || '',
                      employee_mail: employee.employee_mail || '',
                      birth_date: formatDate(employee.birth_date),
                      employment_date: formatDate(employee.employment_date),
                      termination_date: formatDate(employee.termination_date),
                      leave_date_start: formatDate(employee.leave_date_start),
                      leave_date_end: formatDate(employee.leave_date_end),
                      position_id: employee.position_id || '',
                      education_id: employee.education_id || '',
                      marital_status_id: employee.marital_status_id || '',
                      gender_id: employee.gender_id || '',
                      managerial_position_id: employee.managerial_position_id || '',
                      company: employee.company || company
                    });
                    window.scrollTo(0, scrollPos);
                  })
                  .catch(error => {
                    console.error('Error fetching employee details:', error);
                    alert('Failed to fetch employee details');
                  });
              } else {
                setUpdateFormData({
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
              }
            }}
            disabled={isLoading}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
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
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {updateInputFields.map((field) => (
                  <div key={`update-${field.label}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.label.toLowerCase().replace(/\s+/g, '_')}
                      value={updateFormData[field.label.toLowerCase().replace(/\s+/g, '_') as keyof typeof updateFormData] || ''}
                      onChange={handleUpdateInputChange}
                      disabled={!selectedEmployee}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        !selectedEmployee ? 'bg-gray-50' : 'bg-white'
                      } focus:ring-yellow-500 focus:border-yellow-500`}
                    />
                  </div>
                ))}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {dropdownFields.map((field) => (
                  <div key={`update-${field.label}`}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <select
                      name={field.label.toLowerCase().replace(/\s+/g, '_')}
                      value={updateFormData[field.label.toLowerCase().replace(/\s+/g, '_') as keyof typeof updateFormData] || ''}
                      onChange={handleUpdateInputChange}
                      disabled={!selectedEmployee}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        !selectedEmployee ? 'bg-gray-50' : 'bg-white'
                      } focus:ring-yellow-500 focus:border-yellow-500`}
                    >
                      <option value="">{`Select ${field.label}`}</option>
                      {field.label === 'Position ID' && positions.map((item) => (
                        <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                      ))}
                      {field.label === 'Education ID' && educations.map((item) => (
                        <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                      ))}
                      {field.label === 'Marital Status ID' && maritalStatuses.map((item) => (
                        <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                      ))}
                      {field.label === 'Gender ID' && genders.map((item) => (
                        <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                      ))}
                      {field.label === 'Managerial Position ID' && [
                        { id: '1', name: 'Yes' },
                        { id: '2', name: 'No' }
                      ].map((item) => (
                        <option key={item.id} value={item.id}>{item.id}: {item.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsChangeLogOpen(true)}
                disabled={!selectedEmployee}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                View Change Log
              </button>
              <button
                type="button"
                onClick={handleUpdateSubmit}
                disabled={!selectedEmployee || isLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
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

        {/* Add this before the final closing div in your return statement */}
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
    
