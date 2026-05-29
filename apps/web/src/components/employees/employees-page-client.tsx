'use client';

import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { Skeleton } from '@hrms/ui';

interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  workEmail: string;
  department: { name: string } | null;
  designation: { name: string } | null;
  location: { name: string; country: string } | null;
  employmentStatus: string;
  joiningDate: string;
}

const columnHelper = createColumnHelper<Employee>();

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  probation: 'bg-blue-100 text-blue-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-orange-100 text-orange-800',
  terminated: 'bg-red-100 text-red-800',
};

export function EmployeesPageClient() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search: debouncedSearch }],
    queryFn: () =>
      apiClient.get<{
        data: Employee[];
        meta: { total: number; page: number };
      }>('/employees', { search: debouncedSearch || undefined }),
  });

  const columns = [
    columnHelper.accessor('employeeCode', {
      header: 'Code',
      cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('fullName', {
      header: 'Name',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor('workEmail', {
      header: 'Email',
      cell: (info) => <span className="text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.department?.name, {
      id: 'department',
      header: 'Department',
    }),
    columnHelper.accessor((row) => row.designation?.name, {
      id: 'designation',
      header: 'Designation',
    }),
    columnHelper.accessor((row) => row.location?.name, {
      id: 'location',
      header: 'Location',
    }),
    columnHelper.accessor('employmentStatus', {
      header: 'Status',
      cell: (info) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
            STATUS_COLORS[info.getValue()] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {info.getValue()}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.meta.total ?? 0} employees total
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 w-full max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            // Simple debounce
            setTimeout(() => setDebouncedSearch(e.target.value), 300);
          }}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b bg-muted/50">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-5 py-3 text-left font-medium text-muted-foreground"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {columns.map((_, j) => (
                        <td key={j} className="px-5 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
