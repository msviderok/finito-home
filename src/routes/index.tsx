import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { trpc } from '@/router';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Edit2 } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const { data = [] } = useQuery(trpc.listEmployees.queryOptions());

  return (
    <div className="flex p-6">
      <Accordion multiple className="max-w-lg" value={[data[0]?.id]}>
        {data.map((employee) => (
          <AccordionItem key={employee.id} value={employee.id}>
            <AccordionTrigger>{employee.name}</AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment category</TableHead>
                    <TableHead className="flex items-center gap-0.5">
                      Rate <span className="text-muted-foreground">($/hr)</span>
                    </TableHead>
                    <TableHead>Effective from</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.categoryRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>{rate.paymentCategory.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button size="icon-xs">
                                  <Edit2 className="size-3" />
                                </Button>
                              }
                            />

                            <TooltipContent align="start">
                              <p>Edit rate</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="text-sm font-medium">{formatCurrency(rate.amount)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{rate.effectiveFrom.toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function formatCurrency(amount: number) {
  return Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
