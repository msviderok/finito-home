import { useViewAsOf } from '@/contexts/ViewAsOfProvider';
import { groupCategoryRates } from '@/lib/category-rates';
import { formatCurrency } from '@/lib/currency';
import { trpc } from '@/router';
import { useQuery } from '@tanstack/react-query';
import type { CreateRateHandler } from './InlineRateEditor';
import { InlineRateEditor } from './InlineRateEditor';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';

export function PaymentCategoriesSection(props: { employeeId: number; onCreateRate: CreateRateHandler }) {
  const { viewAsOfAt } = useViewAsOf();
  const { data: categoryRates = [] } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId, effectiveDate: viewAsOfAt }),
  );
  const categoryGroups = groupCategoryRates(categoryRates, viewAsOfAt);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Payment categories</h2>
        <Badge variant="outline">{categoryGroups.length} current</Badge>
      </div>
      <Accordion multiple>
        {categoryGroups.map((group) => (
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
  group: ReturnType<typeof groupCategoryRates>[number];
  employeeId: number;
  onCreateRate: CreateRateHandler;
}) {
  return (
    <AccordionItem value={`category-${props.group.paymentCategoryId}`}>
      <AccordionTrigger className="flex items-center">
        <span className="flex items-center gap-2">
          <span className="font-medium">{props.group.paymentCategory.name}</span>
          <Badge>Current</Badge>
        </span>
        <span className="text-muted-foreground tabular-nums">{formatCurrency(props.group.currentRate.amount)}</span>
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
