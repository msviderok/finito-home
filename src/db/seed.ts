import { db } from '.';
import { users } from './schema/users';
import { employees } from './schema/employees';
import { rates } from './schema/rates';
import { paymentCategories } from './schema/paymentCategories';

async function main() {
  await db.transaction(async (tx) => {
    await tx.insert(users).values([{ name: 'Admin User', email: 'admin@example.com' }]);

    const createdCategories = await tx
      .insert(paymentCategories)
      .values([{ name: 'Hourly Rate' }, { name: 'Overtime Hourly' }, { name: 'Commission' }, { name: 'Global Pay' }])
      .returning();

    const createdEmployees = await tx
      .insert(employees)
      .values([
        { name: 'Alice Johnson', birthday: new Date('1988-04-12') },
        { name: 'Ben Carter', birthday: new Date('1992-09-03') },
        { name: 'Clara Evans', birthday: new Date('1985-01-28') },
        { name: 'David Smith', birthday: new Date('1998-11-19') },
        { name: 'Emma Wilson', birthday: new Date('1990-06-07') },
      ])
      .returning();

    await tx.insert(rates).values(
      createdEmployees.flatMap((employee, employeeIndex) =>
        createdCategories.slice(0, 3).map((category, categoryIndex) => ({
          employeeId: employee.id,
          paymentCategoryId: category.id,
          amountCents: 2_000 + employeeIndex * 250 + categoryIndex * 500,
          effectiveFrom: new Date(`2026-0${categoryIndex + 1}-01`),
          createdAt: new Date('2026-01-01'),
        })),
      ),
    );
  });
}

void main();
