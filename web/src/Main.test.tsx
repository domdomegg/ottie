import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import Main from './Main'
import { a, b } from './analytics'

jest.mock('./analytics')

test('has a title', () => {
  const screen = render(<Main />);
  expect(screen.getByText('interactive type inference').tagName).toBe('H1');
});

test('displays correct result after clicking \'4\' sample', () => {
    const screen = render(<Main />);
    expect(screen.queryByText('Int')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('4'));
    screen.getAllByText('Int');
});

test('displays correct result after clicking \'odd 5\' sample', () => {
    const screen = render(<Main />);
    expect(screen.queryByText('Bool')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('odd 5'));
    screen.getAllByText('Bool');
});

test('displays correct result after clicking \': 23 [1]\' sample', () => {
    const screen = render(<Main />);
    expect(screen.queryByText('[Int]')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(': 23 [1]'));
    screen.getAllByText('[Int]');
});

test('displays correct result after entering \'True\'', () => {
    const screen = render(<Main />);
    expect(screen.queryByText('Bool')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'True' }});
    screen.getAllByText('Bool');
});

test('displays correct error after entering \'notInScope\'', () => {
    const screen = render(<Main />);
    expect(screen.queryByText('notInScope')).not.toBeInTheDocument();
    expect(screen.queryByText('We stop here as this is an error', { exact: false })).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'notInScope' }});
    screen.getAllByText('notInScope');
    screen.getAllByText('We stop here as this is an error', { exact: false });
});

test('displays correct error after entering \'\\x -> x x\'', () => {
    const screen = render(<Main />);
    expect(screen.queryByText('Occurs check failed', { exact: false })).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: '\\x -> x x' }});
    screen.getAllByText('Occurs check failed', { exact: false });
    screen.getAllByText('We stop here as this is an error', { exact: false });
});

test('can open and close help modal', () => {
    const screen = render(<Main />);
    expect(screen.queryByText('Language reference')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('help-open-button'));
    screen.getAllByText('Language reference');
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Language reference')).not.toBeInTheDocument();
});

test('clicking buttons sends analytics events', () => {
    const screen = render(<Main />);
    expect(a).toHaveBeenCalledTimes(0);
    fireEvent.click(screen.getByText('4'));
    expect(a).toHaveBeenCalledTimes(1);
    expect((a as any).mock.calls[0][0].name).toBe('codeButtonSet');
    expect((a as any).mock.calls[0][0].value).toBe('4');
});

test('entering text sends debounced analytics events', () => {
    const screen = render(<Main />);
    expect(b).toHaveBeenCalledTimes(0);
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'Just 3' }});
    expect(b).toHaveBeenCalledTimes(1);
    expect((b as any).mock.calls[0][0].name).toBe('codeChange');
    expect((b as any).mock.calls[0][0].value).toBe('Just 3');
});

test('can set algorithm to algorithm M then W', () => {
    const screen = render(<Main />);
    expect(screen.getByText('w')).toHaveClass('active');
    fireEvent.click(screen.getByText('m'));
    expect(screen.getByText('m')).toHaveClass('active');
    expect(screen.queryByText(/We start algorithm M by/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('w'));
    expect(screen.queryByText(/We start algorithm M by/)).not.toBeInTheDocument();
});