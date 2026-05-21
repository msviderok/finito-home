# Finito Home Assignment

## WIP bulletpoints

- If the scope requires, the role should be a separate table with properly set-up relations to manage users' permissions.
- For this assignment, the year starts on January 1 and ends on December 31, but in the future, there might be a need to set up a custom fiscal year.
- For simplicity, the payslip is going to be stored and executed monthly, but for more complex scenarios, custom payslip cadence should be provided.
- We will use cents for the currency-related amounts to ensure there is no problem with the floating math.
- If in future any payslip can be edited by other users, then payslipLineItems should have the created_by_id as well.
- For real user management, we need to set up a proper authentication and authorization system with TRPC's protected procedure.
- If I had more time, I would have added an ability to change any related entity from the form of any other related entity.
- To emit unnecessary front-end related stuff, there might be a potential to notify the server via cookies about the view-as-of date.
