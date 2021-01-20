import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import Main from './Main'

test('has a title', () => {
  const screen = render(<Main />)
  expect(screen.getByText('interactive type inference').tagName).toBe('H1');
});

test('displays correct result after clicking \'4\' sample', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('Int')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('4'));
    screen.getAllByText('Int');
});

test('displays correct result after clicking \': 23 [1]\' sample', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('[Int]')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(': 23 [1]'));
    screen.getAllByText('[Int]');
});

test('displays correct result after entering \'True\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('Bool')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'True' }});
    screen.getAllByText('Bool');
});

test('displays correct error after entering \'notInScope\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('notInScope')).not.toBeInTheDocument();
    expect(screen.queryByText('We stop here as this is an error', { exact: false })).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'notInScope' }});
    screen.getAllByText('notInScope');
    screen.getAllByText('We stop here as this is an error', { exact: false });
});

test('displays correct error after entering \'\\x -> x x\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('Occurs check failed', { exact: false })).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: '\\x -> x x' }});
    screen.getAllByText('Occurs check failed', { exact: false });
    screen.getAllByText('We stop here as this is an error', { exact: false });
});

test('can open and close help modal', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('Language reference')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('help-open-button'));
    screen.getAllByText('Language reference');
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Language reference')).not.toBeInTheDocument();
});