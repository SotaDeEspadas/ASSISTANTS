import React from 'react';
import { useTable, useSortBy, Column, CellProps } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import './DataTable.css';

interface DataTableProps<T> {
  columns: { accessorKey: string; header: string; width?: number }[];
  data: T[];
  sortConfig?: { key: string; direction: 'ASC' | 'DESC' } | null;
  onRequestSort?: (key: string) => void;
  getSortIcon?: (key: string) => React.ReactNode | null;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

// Componente genérico para tabla de datos
export function DataTable<T>({
  columns,
  data,
  sortConfig,
  onRequestSort,
  getSortIcon,
  onRowClick,
}: DataTableProps<T>) {
  // Convertir columnas al formato de TanStack Table
  const tanstackColumns: Column<T>[] = columns.map((col) => ({
    accessorKey: col.accessorKey,
    header: ({ column }) => {
      const canSort = onRequestSort && col.accessorKey;
      return (
        <div
          className={`table-header-cell ${canSort ? 'sortable' : ''}`}
          onClick={() => canSort && onRequestSort(col.accessorKey)}
        >
          <span>{col.header}</span>
          {canSort && getSortIcon && (
            <span className="sort-icon">
              {getSortIcon(col.accessorKey)}
            </span>
          )}
        </div>
      );
    },
    cell: ({ row }: CellProps<T>) => {
      const value = row.getValue<string | number | Date>(col.accessorKey);
      return formatCellValue(value);
    },
    width: col.width,
  }));

  const table = useTable({
    columns: tanstackColumns,
    data,
    manualSorting: true,
  });

  // Función para formatear valores de celdas
  const formatCellValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="cell-null">-</span>;
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('es-ES');
    }

    if (typeof value === 'string') {
      // Truncar strings muy largos
      if (value.length > 50) {
        return (
          <span title={value}>
            {value.substring(0, 47)}...
          </span>
        );
      }
      return value;
    }

    if (typeof value === 'number') {
      // Formatear números grandes
      if (value > 10000) {
        return new Intl.NumberFormat('es-ES').format(value);
      }
      return value;
    }

    return String(value);
  };

  return (
    <div className="data-table">
      <table className="table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{ width: header.column.columnDef.width }}
                  className="table-th"
                >
                  {header.renderHeader()}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="table-tr"
                onClick={() => onRowClick && onRowClick(row.original)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="table-td">
                    {cell.renderCell()}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                No hay datos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
