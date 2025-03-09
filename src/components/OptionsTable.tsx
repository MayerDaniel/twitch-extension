import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect, ReactNode } from "react";
import Card from "./Card";

// Define the row structure
export interface TableRow {
  id: number;
  name: string;
}

// Component props interface
interface OptionsTableProps {
    className?: string;
    title?: string | ReactNode;
    initialRows?: { name: string }[]; // Allow passing initial rows without ids
  }

// Define methods that can be called from parent components
export interface OptionsTableHandle {
  addRow: (name?: string) => number;
  addRows: (rows: Omit<TableRow, "id">[]) => number[];
  clearRows: () => void;
}

const OptionsTable = forwardRef<OptionsTableHandle, OptionsTableProps>((props, ref) => {
  const { className, title = "Options", initialRows = [] } = props;
  const [rows, setRows] = useState<TableRow[]>([]);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize with initialRows only once
  useEffect(() => {
    if (!initialized && initialRows.length > 0) {
      const rowsWithIds = initialRows.map((row, index) => ({
        ...row,
        id: index + 1
      }));
      setRows(rowsWithIds);
      setInitialized(true);
    }
  }, [initialRows, initialized]);
  
  // Method to add a single row
  const addRow = useCallback((name?: string) => {
    const nextId = rows.length > 0 ? Math.max(...rows.map(row => row.id)) + 1 : 1;
    const rowName = name || nextId.toString();
    
    setRows(prevRows => [...prevRows, { id: nextId, name: rowName }]);
    return nextId;
  }, [rows]);
  
  // Method to add multiple rows at once
  const addRows = useCallback((newRows: Omit<TableRow, "id">[]) => {
    if (newRows.length === 0) return [];
    
    const startId = rows.length > 0 ? Math.max(...rows.map(row => row.id)) + 1 : 1;
    const rowsWithIds = newRows.map((row, index) => ({
      ...row,
      id: startId + index
    }));
    
    setRows(prevRows => [...prevRows, ...rowsWithIds]);
    return rowsWithIds.map(row => row.id);
  }, [rows]);
  
  // Method to clear all rows
  const clearRows = useCallback(() => {
    setRows([]);
    setInitialized(false); // Allow re-initialization if needed
  }, []);
  
  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    addRow,
    addRows,
    clearRows
  }), [addRow, addRows, clearRows]);
  
  // Handle row click
  const handleRowClick = useCallback((row: TableRow) => {
    console.log(`Row clicked: ${row.name} (ID: ${row.id})`);
  }, []);
  
  return (
    <Card className={`${className} bg-black text-white !items-stretch`} title={typeof title === 'string' ? title : undefined}>
      <div className="w-full">
        <div className="max-h-64 w-full overflow-y-auto scrollbar scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-black w-full">
              <tr>
                <th className="border-b border-gray-700 py-2 px-4 text-left">ID</th>
                <th className="border-b border-gray-700 py-2 px-4 text-left">Name</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr 
                  key={row.id}
                  onClick={() => handleRowClick(row)}
                  className="cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <td className="border-b border-gray-700 py-2 px-4">{row.id}</td>
                  <td className="border-b border-gray-700 py-2 px-4">{row.name}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-gray-500">
                    No options available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
});

export default OptionsTable;