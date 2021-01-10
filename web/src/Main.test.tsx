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
    expect(screen.getByText('number')).toBeInTheDocument();
});

test('displays correct result after clicking \'+\' sample', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('number -> number -> number')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('number -> number -> number')).toBeInTheDocument();
});

test('displays correct result after entering \'True\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('boolean')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'True' }});
    expect(screen.getByText('boolean')).toBeInTheDocument();
});

test('displays correct error after entering \'notInScope\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('notInScope is not in scope')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('input') as HTMLInputElement), { target: { value: 'notInScope' }});
    expect(screen.getByText('notInScope is not in scope')).toBeInTheDocument();
});