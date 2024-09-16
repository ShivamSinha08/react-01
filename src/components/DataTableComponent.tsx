import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { FaChevronDown } from 'react-icons/fa'; 
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';

interface DataItem {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: string;
  date_end: string;
}

const DataTableComponent: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [rowsToSelect, setRowsToSelect] = useState(''); 
  const overlayPanelRef = useRef<OverlayPanel>(null); 
  const rowsPerPage = 12; 

  // Function to fetch data based on the page number
  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rowsPerPage}`);
      const result = await response.json();
      const artworkData = result.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin || 'Unknown',
        artist_display: item.artist_display || 'Unknown',
        inscriptions: item.inscriptions || 'None',
        date_start: item.date_start || 'N/A',
        date_end: item.date_end || 'N/A',
      }));
      setData(artworkData);
      setTotalRecords(result.pagination.total); 
      setAllSelected(false); 
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  // Handle pagination change
  const onPageChange = (event: any) => {
    const newPage = event.page + 1; 
    setFirst(event.first);
    fetchData(newPage); 
  };

  // Checkbox template for the "Select All" column
  const checkboxTemplate = (rowData: DataItem) => {
    return (
      <Checkbox
        onChange={(e) => onRowSelect(e, rowData)}
        checked={selectedItems.some((item) => item.id === rowData.id)}
        className="mr-2 border border-gray-600 rounded"
      />
    );
  };

  // Handle row selection
  const onRowSelect = (e: any, rowData: DataItem) => {
    const isSelected = e.checked;
    if (isSelected) {
      setSelectedItems([...selectedItems, rowData]);
    } else {
      setSelectedItems(selectedItems.filter((item) => item.id !== rowData.id));
    }
  };

  // Handle "Select All" checkbox
  const onSelectAll = (e: any) => {
    const isChecked = e.checked;
    setAllSelected(isChecked);
    if (isChecked) {
      setSelectedItems(data);
    } else {
      setSelectedItems([]);
    }
  };

  // Handle selecting a specific number of rows, even across paginations
  const handleSelectRowsSubmit = (e: any) => {
    e.preventDefault();
    const numRows = parseInt(rowsToSelect, 10);
    if (!isNaN(numRows) && numRows > 0) {
      const fetchAndSelectRows = async () => {
        let selected: DataItem[] = []; // Explicitly type the selected array as DataItem[]
        let page = 1;
        while (selected.length < numRows) {
          const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rowsPerPage}`);
          const result = await response.json();
          const artworkData = result.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            place_of_origin: item.place_of_origin || 'Unknown',
            artist_display: item.artist_display || 'Unknown',
            inscriptions: item.inscriptions || 'None',
            date_start: item.date_start || 'N/A',
            date_end: item.date_end || 'N/A',
          }));
  
          selected = [...selected, ...artworkData]; // Concatenate new artwork data
          page += 1;
  
          if (selected.length >= numRows) {
            selected = selected.slice(0, numRows);
            break;
          }
        }
        setSelectedItems(selected);
      };
  
      fetchAndSelectRows();
    }
  };
  

  // Highlight row when selected
  const rowClassName = (rowData: DataItem) => {
    return selectedItems.some((item) => item.id === rowData.id) ? 'bg-blue-100' : '';
  };

  // Fetch initial data on component mount
  useEffect(() => {
    fetchData(1); // Load page 1 initially
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <DataTable
          value={data}
          paginator={false}
          loading={loading}
          responsiveLayout="scroll"
          scrollable
          scrollHeight="600px"
          className="table-auto w-full"
          rowClassName={rowClassName} 
        >
          <Column
            header={<Checkbox onChange={onSelectAll} checked={allSelected} className="mr-2 border border-gray-600 rounded" />}
            body={checkboxTemplate}
            style={{ width: '50px' }}
          />
          <Column
            field="title"
            header={
              <div className="flex items-center">
                <FaChevronDown
                  className="cursor-pointer"
                  onClick={(e) => overlayPanelRef.current?.toggle(e)} 
                />
                <span className="ml-2">Title</span>
              </div>
            }
          />
          <Column field="place_of_origin" header="Place of Origin" />
          <Column field="artist_display" header="Artist Display" />
          <Column field="inscriptions" header="Inscriptions" />
          <Column field="date_start" header="Date Start" />
          <Column field="date_end" header="Date End" />
        </DataTable>
      </div>

      <Paginator
        first={first}
        rows={rowsPerPage}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        className="mb-4"
      />

      <OverlayPanel ref={overlayPanelRef} className="p-4 shadow-lg bg-white rounded-md">
        <form onSubmit={handleSelectRowsSubmit} className="flex space-x-2">
          <InputText
            value={rowsToSelect}
            onChange={(e) => setRowsToSelect(e.target.value)}
            placeholder="Select Rows"
            className="border rounded-md p-2"
          />
          <Button type="submit" label="Submit" className="bg-blue-500 text-white p-2 rounded-md" />
        </form>
      </OverlayPanel>
    </div>
  );
};

export default DataTableComponent;
