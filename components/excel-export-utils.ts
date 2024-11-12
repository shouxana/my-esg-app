'use client';

import { utils, write, WorkBook } from 'xlsx';

interface DetailedEmployeeData {
  employee_id: number;
  full_name: string;
  employment_date: string;
  termination_date: string | null;
  education_2021?: string;
  education_2022?: string;
  education_2023?: string;
  education_2024?: string;
}

interface EducationData {
  [year: number]: {
    [education: string]: number;
  };
}

interface Employee {
  employee_id: number;
  full_name: string;
  employment_date: string;
  termination_date: string | null;
  education: string;
  gender: string;
  managerial_position: string;
}

const downloadExcel = (wb: WorkBook, filename: string) => {
  try {
    const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading Excel file:', error);
    throw new Error('Failed to download Excel file');
  }
};

export const exportDetailedEducationData = async (data: DetailedEmployeeData[]) => {
  const wb = utils.book_new();

  const wsData = [
    ['Education Distribution - Detailed'],
    [],
    ['Employee', 'Employment Date', 'Status', '2021', '2022', '2023', '2024'],
  ];

  data.forEach((employee) => {
    wsData.push([
      `ID ${employee.employee_id}: ${employee.full_name}`,
      employee.employment_date,
      employee.termination_date || 'Active',
      employee.education_2021 ?? 'N/A',
      employee.education_2022 ?? 'N/A',
      employee.education_2023 ?? 'N/A',
      employee.education_2024 ?? 'N/A',
    ]);
  });

  const ws = utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  utils.book_append_sheet(wb, ws, 'Detailed Data');

  try {
    const rawData = await fetchRawData();
    createRawDataSheet(wb, rawData);
  } catch (error) {
    console.warn('Could not add raw data sheet:', error);
  }

  downloadExcel(wb, 'education-distribution-detailed.xlsx');
};

const fetchRawData = async (): Promise<Employee[]> => {
  try {
    const response = await fetch('/api/employees/raw-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received');
    }

    return data;
  } catch (error) {
    console.error('Error fetching raw data:', error);
    throw new Error('Failed to fetch raw data');
  }
};

const createRawDataSheet = (wb: WorkBook, rawData: Employee[]) => {
  const wsRawData = [
    ['Employee Raw Data'],
    [],
    [
      'Employee ID',
      'Full Name',
      'Employment Date',
      'Termination Date',
      'Education',
      'Gender',
      'Managerial Position',
    ],
  ];

  rawData.forEach((employee) => {
    wsRawData.push([
      employee.employee_id.toString(),
      employee.full_name,
      employee.employment_date,
      employee.termination_date || 'Active',
      employee.education,
      employee.gender,
      employee.managerial_position,
    ]);
  });

  const wsRaw = utils.aoa_to_sheet(wsRawData);
  wsRaw['!cols'] = [
    { width: 12 },
    { width: 25 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 10 },
    { width: 15 },
  ];

  utils.book_append_sheet(wb, wsRaw, 'Raw Data');
};

export const exportEducationData = async (
  data: { labels: string[]; years: number[]; data: EducationData }
) => {
  const wb = utils.book_new();

  const wsDistData = [
    ['Education Distribution Data'],
    [],
    ['Education Level', ...data.years.map((year) => year.toString())],
  ];

  data.labels.forEach((education) => {
    const row = [education];
    data.years.forEach((year) => {
      row.push(`${data.data[year]?.[education]?.toFixed(1)}%`);
    });
    wsDistData.push(row);
  });

  const wsDistribution = utils.aoa_to_sheet(wsDistData);
  wsDistribution['!cols'] = [20, ...data.years.map(() => 15)].map((width) => ({ width }));
  utils.book_append_sheet(wb, wsDistribution, 'Education Distribution');

  try {
    const rawData = await fetchRawData();
    createRawDataSheet(wb, rawData);
  } catch (error) {
    console.warn('Could not add raw data sheet:', error);
  }

  downloadExcel(wb, 'education_data.xlsx');
};

export const exportGenderData = async (
  data: {
    years: number[];
    data: {
      [year: number]: {
        Male: number;
        Female: number;
        FemaleManagers: number;
        MaleCount: number;
        FemaleCount: number;
        FemaleManagerCount: number;
      };
    };
    managerData: {
      [year: number]: {
        Male: number;
        Female: number;
        MaleCount: number;
        FemaleCount: number;
      };
    };
  }
) => {
  const wb = utils.book_new();

  const wsDistData = [
    ['Gender Distribution Data'],
    [],
    ['Year', 'Male %', 'Male Count', 'Female %', 'Female Count', 'Women in Management %', 'Women Managers Count'],
  ];

  data.years.forEach((year) => {
    const yearData = data.data[year];
    if (yearData) {
      wsDistData.push([
        year.toString(),
        yearData.Male ? `${yearData.Male.toFixed(1)}%` : '0%',
        yearData.MaleCount.toString(),
        yearData.Female ? `${yearData.Female.toFixed(1)}%` : '0%',
        yearData.FemaleCount.toString(),
        yearData.FemaleManagers ? `${yearData.FemaleManagers.toFixed(1)}%` : '0%',
        yearData.FemaleManagerCount.toString(),
      ]);
    }
  });

  const wsDistribution = utils.aoa_to_sheet(wsDistData);
  wsDistribution['!cols'] = [
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 20 },
    { width: 20 },
  ];
  utils.book_append_sheet(wb, wsDistribution, 'Gender Distribution');

  try {
    const rawData = await fetchRawData();
    createRawDataSheet(wb, rawData);
  } catch (error) {
    console.warn('Could not add raw data sheet:', error);
  }

  downloadExcel(wb, 'gender_data.xlsx');
};

