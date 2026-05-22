import { fireEvent, screen, waitFor, within } from '@testing-library/react';

export async function selectComboboxOption(placeholder: string, optionLabel: string) {
  const input = screen.getByPlaceholderText(placeholder);
  const inputGroup = input.closest('[data-slot="input-group"]') as HTMLElement | null;
  if (!inputGroup) throw new Error('Combobox input group not found');

  fireEvent.focus(input);
  fireEvent.click(within(inputGroup).getByRole('button'));

  const option = await waitFor(() => {
    const items = screen.queryAllByRole('option');
    const match = items.find((node) => node.textContent?.includes(optionLabel));
    if (match) return match;

    const fallback = screen
      .getAllByText((_, element) => element?.textContent?.includes(optionLabel) ?? false)
      .find((node) => node.closest('[data-slot="combobox-item"]'));
    if (!fallback) throw new Error(`Combobox option not found: ${optionLabel}`);
    return fallback;
  });

  fireEvent.click(option);
}

export function getHoursInputForCategory(categoryLabel: string) {
  const row = screen.getByText(categoryLabel).closest('tr');
  if (!row) throw new Error(`Line item row not found for ${categoryLabel}`);
  return within(row as HTMLElement).getByRole('textbox');
}
