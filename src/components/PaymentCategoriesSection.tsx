import { formatCurrency } from '@/lib/currency';
import { InlineRateEditor } from './RateEditPopover';
import type { CategoryRateGroup, CreateRateHandler } from './EmployeePayrollAccordion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';

export function PaymentCategoriesSection(props: {
  employeeId: number;
  categoryGroups: CategoryRateGroup[];
  onCreateRate: CreateRateHandler;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Payment categories</h2>
        <Badge variant="outline">{props.categoryGroups.length} current</Badge>
      </div>
      <Accordion multiple>
        {props.categoryGroups.map((group) => (
          <PaymentCategoryAccordionItem
            key={group.paymentCategoryId}
            group={group}
            employeeId={props.employeeId}
            onCreateRate={props.onCreateRate}
          />
        ))}
      </Accordion>
    </section>
  );
}

export function PaymentCategoryAccordionItem(props: {
  group: CategoryRateGroup;
  employeeId: number;
  onCreateRate: CreateRateHandler;
}) {
  return (
    <AccordionItem value={`category-${props.group.paymentCategoryId}`}>
      <AccordionTrigger className="items-center">
        <span className="font-medium">{props.group.paymentCategory.name}</span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <span className="text-muted-foreground tabular-nums">{formatCurrency(props.group.currentRate.amount)}</span>
          <span className="text-muted-foreground tabular-nums">
            {props.group.currentRate.effectiveFrom.toLocaleDateString()}
          </span>
          <Badge>Current</Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <InlineRateEditor
          currentRate={props.group.currentRate}
          history={props.group.rates}
          employeeId={props.employeeId}
          onCreateRate={props.onCreateRate}
        />
      </AccordionContent>
    </AccordionItem>
  );
}
