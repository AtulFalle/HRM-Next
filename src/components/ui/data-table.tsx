'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  MoreHorizontal, 
  Search,
  Filter,
  Download
} from 'lucide-react'
import { AccessibleTable, ScreenReaderOnly, AccessibleLoading } from './accessibility-utils'

interface Column<T> {
  key: string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface Action<T> {
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  variant?: 'default' | 'destructive'
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  filters?: React.ReactNode
  pagination?: {
    page: number
    limit: number
    total: number
    onPageChange: (page: number) => void
  }
  loading?: boolean
  emptyMessage?: string
  exportable?: boolean
  onExport?: () => void
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  searchable = true,
  searchPlaceholder = 'Search...',
  filters,
  pagination,
  loading = false,
  emptyMessage = 'No data available',
  exportable = false,
  onExport,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter data based on search
  const filteredData = data.filter((row) => {
    if (!search) return true
    return columns.some((column) => {
      const value = column.key.includes('.') 
        ? column.key.split('.').reduce((obj: any, key) => obj?.[key], row)
        : row[column.key]
      return String(value).toLowerCase().includes(search.toLowerCase())
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0
    
    const aValue = sortField.includes('.') 
      ? sortField.split('.').reduce((obj: any, key) => obj?.[key], a)
      : a[sortField]
    const bValue = sortField.includes('.') 
      ? sortField.split('.').reduce((obj: any, key) => obj?.[key], b)
      : b[sortField]

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const renderCell = (column: Column<T>, row: T) => {
    const value = column.key.includes('.') 
      ? column.key.split('.').reduce((obj: any, key) => obj?.[key], row)
      : row[column.key]

    if (column.render) {
      return column.render(value, row)
    }

    // Default rendering
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (typeof value === 'string' && value.includes('@')) {
      return <span className="text-blue-600">{value}</span>
    }

    return <span>{value}</span>
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <AccessibleLoading message="Loading data..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Table</CardTitle>
          {exportable && onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search table data"
              />
              <ScreenReaderOnly>
                Type to search through the table data. Results will update as you type.
              </ScreenReaderOnly>
            </div>
          )}
          {filters && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              {filters}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <AccessibleTable caption="Data table with search and sorting capabilities">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={column.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                    style={{ width: column.width }}
                    role="columnheader"
                    aria-sort={column.sortable && sortField === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    tabIndex={column.sortable ? 0 : -1}
                    onKeyDown={(e) => {
                      if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        handleSort(String(column.key))
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && sortField === column.key && (
                        <span className="text-xs" aria-label={`Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}>
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="w-12" role="columnheader">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                    <div className="text-gray-500">{emptyMessage}</div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {renderCell(column, row)}
                      </TableCell>
                    ))}
                    {actions && actions.length > 0 && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {actions.map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                className={action.variant === 'destructive' ? 'text-red-600' : ''}
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </AccessibleTable>
        </div>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(1)}
                disabled={pagination.page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(totalPages)}
                disabled={pagination.page === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
