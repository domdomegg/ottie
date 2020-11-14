import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import Main from './Main'

test('has a title', () => {
  const screen = render(<Main />)
  expect(screen.getByText('interactive type inference').tagName).toBe('H1');
});

test('displays correct result after clicking \'myNumber\' sample', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('number')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('myNumber'));
    expect(screen.getByText('number')).toBeInTheDocument();
});

test('displays correct result after clicking \'map not []\' sample', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('[] (boolean)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('map not []'));
    expect(screen.getByText('[] (boolean)')).toBeInTheDocument();
});

test('displays correct result after entering \'True\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('boolean')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('textarea') as HTMLTextAreaElement), { target: { value: 'e(\'True\')' }});
    expect(screen.getByText('boolean')).toBeInTheDocument();
});

test('displays correct error after entering \'notInScope\'', () => {
    const screen = render(<Main />)
    expect(screen.queryByText('Error: Not a valid expression: notInScope is not in scope')).not.toBeInTheDocument();
    fireEvent.change((screen.container.querySelector('textarea') as HTMLTextAreaElement), { target: { value: 'e(\'notInScope\')' }});
    expect(screen.getByText('Error: Not a valid expression: notInScope is not in scope')).toBeInTheDocument();
});