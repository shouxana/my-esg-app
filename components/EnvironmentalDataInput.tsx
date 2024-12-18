'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Download, History, Loader2 } from 'lucide-react';
import FleetUpdateLogModal from './FleetUpdateLogModal';
import * as XLSX from 'xlsx-js-style';
import { ColumnMapping } from '@/types/column-mapping';
import ColumnMappingModal from '../components/ColumnMappingModal';

interface Vehicle {
  vehicle_id: string;
  registration_number: string;
  vehicle_type_id: number;
  created_at: string;
  updated_at: string;
  company: string;
  production_date: string | null;
  purchase_date: string | null;
  sale_date: string | null;
}

interface EnvironmentalDataInputProps {
  company?: string;
}

const EnvironmentalDataInput: React.FC<EnvironmentalDataInputProps> = ({ company = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<{vehicle_type_id: number, vehicle_type: string}[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isChangeLogOpen, setIsChangeLogOpen] = useState(false);
  const [isColumnMappingOpen, setIsColumnMappingOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  

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
  
      const response = await fetch('/api/import-fleet', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import data');
      }
  
      const result = await response.json();
      alert(`Successfully imported ${result.count} vehicles`);
      
      // Refresh vehicle list
      const updatedVehicles = await fetch(`/api/fleet?company=${encodeURIComponent(company)}`).then(res => res.json());
      setVehicles(updatedVehicles);
    } catch (error) {
      console.error('Error importing data:', error);
      alert(`Failed to import data: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
      setIsColumnMappingOpen(false);
      setSelectedFile(null);
    }
  };
  
  const downloadExcelTemplate = async () => {
    if (vehicleTypes.length === 0) {
      try {
        setIsLoading(true);
        const typesRes = await fetch('/api/vehicle-types');
        if (!typesRes.ok) throw new Error('Failed to fetch vehicle types');
        const typesData = await typesRes.json();
        setVehicleTypes(typesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch data for the template. Please try again.');
        return;
      } finally {
        setIsLoading(false);
      }
    }
  
    const headers = [
      'registration_number',
      'vehicle_type_id',
      'production_date', 
      'purchase_date',
      'sale_date'
    ];
  
    const ws_data = [
      ['For Vehicle Type ID, refer to the Vehicle Types sheet for valid IDs. Please DELETE THIS ROW before importing!'],
      headers
    ];
  
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
  
    const vehicleTypesSheet = XLSX.utils.json_to_sheet(
      vehicleTypes.map(type => ({ ID: type.vehicle_type_id, Name: type.vehicle_type}))
    );
    XLSX.utils.book_append_sheet(wb, vehicleTypesSheet, 'Vehicle Types');
  
    XLSX.writeFile(wb, `fleet_template_${company}.xlsx`);
  };


  const [formData, setFormData] = useState({
    registration_number: '',
    vehicle_type_id: '',
    production_date: '',
    purchase_date: '',
    sale_date: '',
    company
  });

  const [updateFormData, setUpdateFormData] = useState({
    registration_number: '',
    vehicle_type_id: '',
    production_date: '',
    purchase_date: '',
    sale_date: '',
    company
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!company) return;
      
      setIsLoading(true);
      try {
        const [vehiclesRes, typesRes] = await Promise.all([
          fetch(`/api/fleet?company=${encodeURIComponent(company)}`),
          fetch('/api/vehicle-types')
        ]);
        
        if (!vehiclesRes.ok || !typesRes.ok) throw new Error('Failed to fetch data');
        
        const [vehiclesData, typesData] = await Promise.all([
          vehiclesRes.json(),
          typesRes.json()
        ]);
        
        setVehicles(vehiclesData);
        setVehicleTypes(typesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [company]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    if (!vehicleId) {
      setSelectedVehicle('');
      setUpdateFormData({
        registration_number: '',
        vehicle_type_id: '',
        production_date: '',
        purchase_date: '',
        sale_date: '',
        company
      });
      return;
    }
   
    try {
      setIsLoading(true);
      const response = await fetch(`/api/fleet?id=${vehicleId}&company=${encodeURIComponent(company)}`);
      if (!response.ok) throw new Error('Failed to fetch vehicle details');
      
      const vehicle = await response.json();
      if (vehicle) {
        setSelectedVehicle(vehicleId);
        setUpdateFormData({
          registration_number: vehicle.registration_number || '',
          vehicle_type_id: vehicle.vehicle_type_id?.toString() || '',
          production_date: formatDate(vehicle.production_date) || '',
          purchase_date: formatDate(vehicle.purchase_date) || '',
          sale_date: formatDate(vehicle.sale_date) || '',
          company: vehicle.company || company
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      alert('Failed to fetch vehicle details');
    } finally {
      setIsLoading(false);
    }
   };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vehicle_type_id: parseInt(formData.vehicle_type_id)
        })
      });

      if (!response.ok) throw new Error('Failed to add vehicle');
      
      alert('Vehicle added successfully!');
      const updatedVehicles = await fetch(`/api/fleet?company=${encodeURIComponent(company)}`).then(res => res.json());
      setVehicles(updatedVehicles);
      
      setFormData({
        registration_number: '',
        vehicle_type_id: '',
        production_date: '',
        purchase_date: '',
        sale_date: '',
        company
      });
    } catch (error) {
      console.error('Error adding vehicle:', error);
      alert(`Failed to add vehicle: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) {
      alert('Please select a vehicle');
      return;
    }
  
    setIsLoading(true);
    try {
      // Include company in the URL as a query parameter
      const response = await fetch(`/api/fleet/${selectedVehicle}?company=${encodeURIComponent(company)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updateFormData,
          vehicle_type_id: parseInt(updateFormData.vehicle_type_id),
          // Ensure dates are properly formatted or null if empty
          production_date: updateFormData.production_date || null,
          purchase_date: updateFormData.purchase_date || null,
          sale_date: updateFormData.sale_date || null
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update vehicle');
      }
  
      const result = await response.json();
      alert('Vehicle updated successfully!');
      
      // Refresh vehicle list
      const updatedVehicles = await fetch(`/api/fleet?company=${encodeURIComponent(company)}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch updated vehicles');
        return res.json();
      });
      
      setVehicles(updatedVehicles);
      
      // Reset form if needed
      setSelectedVehicle('');
      setUpdateFormData({
        registration_number: '',
        vehicle_type_id: '',
        production_date: '',
        purchase_date: '',
        sale_date: '',
        company
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert(`Failed to update vehicle: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
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
      <div className="bg-gradient-to-r from-white-100 to-white-50 p-6 rounded-lg shadow-sm border-2 border-green-300">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Environmental Data Management</h1>
        </div>
        <p className="text-sm text-gray-600">
          Track and manage CO2 emmisions, fleet and utilities data for {company.toUpperCase()}
        </p>
      </div>

      
      {/* Main Form Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Vehicle Section */}
        <div className="bg-white rounded-lg shadow-lg border border-green-100">
          <div className="bg-green-100 p-4 rounded-t-lg border-b border-green-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Add New Vehicle</h2>
                <p className="text-sm text-gray-600">Enter details for new vehicle</p>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray rounded-md hover:bg-gray-100 border border-gray-200 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelImport}
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
          <div className="p-6 flex flex-col min-h-[600px]">
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicle_type_id"
                    value={formData.vehicle_type_id}
                    onChange={handleInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map(type => (
                      <option key={type.vehicle_type_id} value={type.vehicle_type_id}>
                        {type.vehicle_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Production Date
                  </label>
                  <input
                    type="date"
                    name="production_date"
                    value={formData.production_date}
                    onChange={handleInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Date
                  </label>
                  <input
                    type="date"
                    name="sale_date"
                    value={formData.sale_date}
                    onChange={handleInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                  />
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
                      <span>Adding Vehicle...</span>
                    </div>
                    : 'Add Vehicle'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

{/* Update Vehicle Section */}
<div className="bg-white rounded-lg shadow-lg border border-green-50 min-h-[600px]">
          <div className="bg-green-50 p-4 rounded-t-lg border-b border-green-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Update Vehicle</h2>
                <p className="text-sm text-gray-600">Modify existing vehicle information</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!selectedVehicle) {
                    alert('Please select a vehicle first');
                    return;
                  }
                  setIsChangeLogOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                <History className="h-4 w-4" />
                View Change Log
              </button>
            </div>
          </div>
          <div className="p-6 flex flex-col min-h-[600px]">
            <form onSubmit={handleUpdateSubmit} className="flex flex-col flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Vehicle to Update
                </label>
                <select
                  value={selectedVehicle}
                  onChange={handleVehicleSelect}
                  className="w-full h-10 p-2 border rounded-md mb-4"
                >
                  <option value="">Select a vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.vehicle_id}: {vehicle.registration_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {/* ... update form fields ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    value={updateFormData.registration_number}
                    onChange={handleUpdateInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                    required
                    disabled={!selectedVehicle}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicle_type_id"
                    value={updateFormData.vehicle_type_id}
                    onChange={handleUpdateInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                    required
                    disabled={!selectedVehicle}
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map(type => (
                      <option key={type.vehicle_type_id} value={type.vehicle_type_id}>
                        {type.vehicle_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Production Date
                  </label>
                  <input
                    type="date"
                    name="production_date"
                    value={updateFormData.production_date}
                    onChange={handleUpdateInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                    disabled={!selectedVehicle}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={updateFormData.purchase_date}
                    onChange={handleUpdateInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                    disabled={!selectedVehicle}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Date
                  </label>
                  <input
                    type="date"
                    name="sale_date"
                    value={updateFormData.sale_date}
                    onChange={handleUpdateInputChange}
                    className="w-full h-10 p-2 border rounded-md"
                    disabled={!selectedVehicle}
                  />
                </div>
              </div>

              <div className="mt-auto pt-6">
                <button
                  type="submit"
                  disabled={!selectedVehicle || isLoading}
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

{isChangeLogOpen && (
        <FleetUpdateLogModal
          isOpen={isChangeLogOpen}
          onClose={() => setIsChangeLogOpen(false)}
          vehicleId={selectedVehicle}
          vehicleNumber={updateFormData.registration_number}
          company={company}
        />
      )}
    </div>
    
  );
}
export default EnvironmentalDataInput;