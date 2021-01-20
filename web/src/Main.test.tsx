import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import Main from './Main'

test('has a title', () => {
  const screen = render(<Main />)
  expect(screen.getByText('interactive type inference').tagName).toBe('H1');
});

test('displays correct result after clicking \'4\' sample', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('number')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('4'));
    screen.getAllByText('number');
});

test('displays correct result after clicking \': 23 [1]\' sample', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('[number]')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(': 23 [1]'));
    screen.getAllByText('[number]');
});

test('displays correct result after entering \'True\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('boolean')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'True' }});
    screen.getAllByText('boolean');
});

test('displays correct error after entering \'notInScope\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('notInScope')).not.toBeInTheDocument();
    expect(screen.queryByText('but find it is not in scope')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'notInScope' }});
    screen.getAllByText('notInScope');
    screen.getAllByText('We stop here as this is an error', { exact: false });
});