import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RateEditPopover } from '@/components/RateEditPopover';
import { formatCurrency } from '@/lib/currency';
import { trpc } from '@/router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const { data = [] } = useQuery(trpc.listEmployees.queryOptions());
  const createRate = useMutation(trpc.createRate.mutationOptions());
  const [editingId, setEditingId] = useState<number | null>(null);
  const stopEditing = () => setEditingId(null);

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
                          <RateEditPopover
                            rate={rate}
                            employeeId={employee.id}
                            open={editingId === rate.id}
                            editDisabled={editingId != null && editingId !== rate.id}
                            onEditClick={() => setEditingId(rate.id)}
                            onStopEditing={stopEditing}
                            onCreateRate={async (input) => {
                              await createRate.mutateAsync(input);
                            }}
                          />
                          <span className="text-sm font-medium tabular-nums">{formatCurrency(rate.amount)}</span>
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
