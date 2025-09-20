'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Eye, Users } from 'lucide-react'

interface TeamPayrollSummary {
  employeeId: string
  employeeName: string
  department: string
  basicSalary: number
  allowances: number
  deductions: number
  netSalary: number
  status: 'PROCESSED' | 'PENDING' | 'APPROVED'
}

interface TeamPayrollSummaryProps {
  summary: TeamPayrollSummary[]
  onViewDetails: (employee: TeamPayrollSummary) => void
}

export function TeamPayrollSummaryComponent({ 
  summary, 
  onViewDetails 
}: TeamPayrollSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Team Payroll Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {summary.map((employee) => (
            <AccordionItem key={employee.employeeId} value={employee.employeeId}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{employee.employeeName}</div>
                      <div className="text-sm text-gray-500">{employee.employeeId} • {employee.department}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        ₹{employee.netSalary.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Net Salary</div>
                    </div>
                    <Badge 
                      variant={
                        employee.status === 'PROCESSED' ? 'default' :
                        employee.status === 'APPROVED' ? 'secondary' : 'outline'
                      }
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Basic Salary</div>
                    <div className="font-medium">₹{employee.basicSalary.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Allowances</div>
                    <div className="font-medium text-green-600">₹{employee.allowances.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Deductions</div>
                    <div className="font-medium text-red-600">₹{employee.deductions.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewDetails(employee)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

